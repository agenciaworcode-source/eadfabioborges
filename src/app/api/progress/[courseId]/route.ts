import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface LessonProgressRow {
  lesson_id: string
  completed: boolean
  watched_secs: number
}

interface LessonRow {
  id: string
  module_id: string
}

interface ModuleRow {
  id: string
  lessons: LessonRow[]
}

export async function GET(
  _request: Request,
  { params }: { params: { courseId: string } }
) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { courseId } = params

  // Buscar todos os lesson IDs do curso
  const { data: modulesData, error: modulesError } = await supabase
    .from('modules')
    .select('id, lessons(id, module_id)')
    .eq('course_id', courseId)

  if (modulesError) {
    return NextResponse.json({ error: modulesError.message }, { status: 500 })
  }

  const modules = (modulesData ?? []) as unknown as ModuleRow[]
  const lessonIds = modules.flatMap((m) =>
    (m.lessons ?? []).map((l: LessonRow) => l.id)
  )

  if (lessonIds.length === 0) {
    return NextResponse.json({ lessons: {} })
  }

  // Buscar progresso do usuário para essas aulas
  const { data: progressData, error: progressError } = await supabase
    .from('lesson_progress')
    .select('lesson_id, completed, watched_secs')
    .eq('user_id', user.id)
    .in('lesson_id', lessonIds)

  if (progressError) {
    return NextResponse.json({ error: progressError.message }, { status: 500 })
  }

  const rows = (progressData ?? []) as unknown as LessonProgressRow[]

  const lessons: Record<string, { completed: boolean; watchedSecs: number }> =
    {}

  for (const row of rows) {
    lessons[row.lesson_id] = {
      completed: row.completed,
      watchedSecs: row.watched_secs,
    }
  }

  return NextResponse.json({ lessons })
}
