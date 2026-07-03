import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

function buildSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

async function generateUniqueSlug(supabase: SupabaseClient, baseSlug: string): Promise<string> {
  let slug = baseSlug
  let suffix = 1
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data } = await supabase.from('courses').select('id').eq('slug', slug).maybeSingle()
    if (!data) return slug
    suffix++
    slug = `${baseSlug}-${suffix}`
  }
}

interface CourseRow {
  id: string
  title: string
  description: string | null
  price: number | null
  is_vip: boolean | null
  level: string | null
  category: string | null
  thumbnail_url: string | null
  access_type: string | null
  certificate_enabled: boolean | null
  access_days: number | null
}

interface LessonRow {
  id: string
  title: string
  type: string | null
  vimeo_id: string | null
  youtube_url: string | null
  video_thumbnail_url: string | null
  completion_percent: number | null
  content_body: string | null
  embed_url: string | null
  pdf_url: string | null
  duration_secs: number | null
  order: number | null
  is_free_preview: boolean | null
}

interface ModuleRow {
  id: string
  title: string
  order: number | null
  is_free_preview: boolean | null
  lessons: LessonRow[]
}

interface QuestionRow {
  type: string | null
  body: string
  options: unknown
  correct_answer: string | null
}

interface QuizRow {
  id: string
  lesson_id: string | null
  course_id: string | null
  scope: string | null
  title: string
  pass_score: number | null
  attempts_allowed: number | null
  questions: QuestionRow[]
}

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: profileData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if ((profileData as { role: string } | null)?.role !== 'admin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const { data: source, error: fetchError } = await supabase
    .from('courses')
    .select(
      'id, title, description, price, is_vip, level, category, thumbnail_url, access_type, certificate_enabled, access_days'
    )
    .eq('id', params.id)
    .single()

  if (fetchError || !source) {
    return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })
  }

  const src = source as unknown as CourseRow
  const newTitle = `Cópia de ${src.title}`
  const baseSlug = buildSlug(newTitle)
  const slug = await generateUniqueSlug(supabase, baseSlug)
  const newId = crypto.randomUUID()

  const { error: insertError } = await supabase.from('courses').insert({
    id: newId,
    slug,
    title: newTitle,
    description: src.description ?? '',
    price: src.price ?? 0,
    is_vip: src.is_vip ?? false,
    published: false,
    level: src.level ?? 'todos',
    category: src.category ?? null,
    thumbnail_url: src.thumbnail_url ?? null,
    access_type: src.access_type ?? 'paid',
    certificate_enabled: src.certificate_enabled ?? true,
    access_days: src.access_days ?? null,
  } as never)

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // ─── Copiar estrutura: módulos → aulas → quizzes → questões ────────────────
  const { data: modulesData } = await supabase
    .from('modules')
    .select(
      'id, title, order, is_free_preview, lessons(id, title, type, vimeo_id, youtube_url, video_thumbnail_url, completion_percent, content_body, embed_url, pdf_url, duration_secs, order, is_free_preview)'
    )
    .eq('course_id', params.id)

  const modules = (modulesData ?? []) as unknown as ModuleRow[]
  // Mapa aula original → aula copiada (para duplicar quizzes de aula)
  const lessonIdMap = new Map<string, string>()

  for (const mod of modules) {
    const { data: newModData, error: modError } = await supabase
      .from('modules')
      .insert({
        course_id: newId,
        title: mod.title,
        order: mod.order ?? 0,
        is_free_preview: mod.is_free_preview ?? false,
      } as never)
      .select('id')
      .single()

    if (modError || !newModData) {
      return NextResponse.json(
        { error: `Falha ao copiar módulo "${mod.title}": ${modError?.message}` },
        { status: 500 }
      )
    }

    const newModId = (newModData as { id: string }).id

    for (const lesson of mod.lessons ?? []) {
      const { data: newLessonData, error: lessonError } = await supabase
        .from('lessons')
        .insert({
          module_id: newModId,
          title: lesson.title,
          type: lesson.type ?? 'video',
          vimeo_id: lesson.vimeo_id,
          youtube_url: lesson.youtube_url,
          video_thumbnail_url: lesson.video_thumbnail_url,
          completion_percent: lesson.completion_percent ?? 0,
          content_body: lesson.content_body,
          embed_url: lesson.embed_url,
          pdf_url: lesson.pdf_url,
          duration_secs: lesson.duration_secs ?? 0,
          order: lesson.order ?? 0,
          is_free_preview: lesson.is_free_preview ?? false,
        } as never)
        .select('id')
        .single()

      if (lessonError || !newLessonData) {
        return NextResponse.json(
          { error: `Falha ao copiar aula "${lesson.title}": ${lessonError?.message}` },
          { status: 500 }
        )
      }

      lessonIdMap.set(lesson.id, (newLessonData as { id: string }).id)
    }
  }

  // Quizzes de aula (das aulas originais) + prova final do curso
  const originalLessonIds = Array.from(lessonIdMap.keys())
  const quizFilters = [`course_id.eq.${params.id}`]
  if (originalLessonIds.length > 0) {
    quizFilters.push(`lesson_id.in.(${originalLessonIds.join(',')})`)
  }

  const { data: quizzesData } = await supabase
    .from('quizzes')
    .select(
      'id, lesson_id, course_id, scope, title, pass_score, attempts_allowed, questions(type, body, options, correct_answer)'
    )
    .or(quizFilters.join(','))

  const quizzes = (quizzesData ?? []) as unknown as QuizRow[]

  for (const quiz of quizzes) {
    const newLessonId = quiz.lesson_id ? lessonIdMap.get(quiz.lesson_id) : null
    // Quiz de aula sem aula correspondente copiada — ignorar
    if (quiz.lesson_id && !newLessonId) continue

    const { data: newQuizData, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        lesson_id: newLessonId,
        course_id: quiz.course_id ? newId : null,
        scope: quiz.scope ?? 'lesson',
        title: quiz.title,
        pass_score: quiz.pass_score ?? 70,
        attempts_allowed: quiz.attempts_allowed ?? 3,
      } as never)
      .select('id')
      .single()

    if (quizError || !newQuizData) {
      return NextResponse.json(
        { error: `Falha ao copiar quiz "${quiz.title}": ${quizError?.message}` },
        { status: 500 }
      )
    }

    const newQuizId = (newQuizData as { id: string }).id
    const questions = quiz.questions ?? []

    if (questions.length > 0) {
      const { error: questionsError } = await supabase.from('questions').insert(
        questions.map((question) => ({
          quiz_id: newQuizId,
          type: question.type ?? 'multiple_choice',
          body: question.body,
          options: question.options ?? [],
          correct_answer: question.correct_answer,
        })) as never
      )

      if (questionsError) {
        return NextResponse.json(
          { error: `Falha ao copiar questões do quiz "${quiz.title}": ${questionsError.message}` },
          { status: 500 }
        )
      }
    }
  }

  return NextResponse.json({ courseId: newId, slug }, { status: 201 })
}
