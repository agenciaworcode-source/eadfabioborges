import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type LessonProgressInsert =
  Database['public']['Tables']['lesson_progress']['Insert']

const progressSchema = z.object({
  lessonId: z.string().uuid(),
  watchedSecs: z.number().min(0),
  completed: z.boolean().optional(),
})

interface ModuleRow {
  id: string
  lessons: Array<{ id: string }>
}

interface LessonProgressRow {
  lesson_id: string
  completed: boolean
}

export async function POST(request: Request) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = progressSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { lessonId, watchedSecs, completed } = parsed.data

  const payload: LessonProgressInsert = {
    user_id: user.id,
    lesson_id: lessonId,
    watched_secs: watchedSecs,
    completed: completed ?? false,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('lesson_progress')
    .upsert(payload as never, { onConflict: 'user_id,lesson_id' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // ─── Trigger de conclusão de curso ──────────────────────────────────────
  // Quando uma aula é marcada como completa, verifica se o curso inteiro foi concluído
  if (completed) {
    void checkCourseCompletion(user.id, lessonId)
  }

  return NextResponse.json({ updated: true })
}

async function checkCourseCompletion(
  userId: string,
  lessonId: string
) {
  const supabase = createClient()
  try {
    // Encontrar o curso desta aula
    const { data: lessonData } = await supabase
      .from('lessons')
      .select('module_id, modules(course_id)')
      .eq('id', lessonId)
      .single()

    type LessonWithModule = {
      module_id: string
      modules: { course_id: string } | null
    }
    const lesson = lessonData as unknown as LessonWithModule | null
    if (!lesson?.modules?.course_id) return

    const courseId = lesson.modules.course_id

    // Verificar se há enrollment ativo para este curso
    const { data: enrollmentData } = await supabase
      .from('enrollments')
      .select('id, status')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('status', 'active')
      .maybeSingle()

    const enrollment = enrollmentData as { id: string; status: string } | null
    if (!enrollment) return

    // Buscar todos os lesson IDs do curso
    const { data: modulesData } = await supabase
      .from('modules')
      .select('id, lessons(id)')
      .eq('course_id', courseId)

    const modules = (modulesData ?? []) as unknown as ModuleRow[]
    const allLessonIds = modules.flatMap((m) =>
      (m.lessons ?? []).map((l) => l.id)
    )

    if (allLessonIds.length === 0) return

    // Buscar progresso atual
    const { data: progressData } = await supabase
      .from('lesson_progress')
      .select('lesson_id, completed')
      .eq('user_id', userId)
      .in('lesson_id', allLessonIds)

    const progress = (progressData ?? []) as unknown as LessonProgressRow[]
    const completedIds = new Set(
      progress.filter((p) => p.completed).map((p) => p.lesson_id)
    )

    const allDone = allLessonIds.every((id) => completedIds.has(id))
    if (!allDone) return

    // Marcar enrollment como concluído
    await supabase
      .from('enrollments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      } as never)
      .eq('id', enrollment.id)

    // Disparar geração de certificado (fire-and-forget)
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    fetch(`${appUrl}/api/certificate/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId }),
      // Não aguarda resposta — geração é assíncrona
    }).catch(() => {
      // Falha silenciosa — não bloqueia o aluno
    })
  } catch {
    // Fire-and-forget — erros não afetam o save de progresso
  }
}
