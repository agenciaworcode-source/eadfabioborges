import { createClient } from '@/lib/supabase/server'
import {
  AdminAvaliacoesClient,
  type AvaliacoesCourse,
  type LessonQuiz,
  type QuizSummary,
} from '@/components/admin/AdminAvaliacoesClient'

interface PageProps {
  searchParams?: {
    courseId?: string
  }
}

interface CourseRaw {
  id: string
  title: string
  slug: string
  published: boolean | null
  modules: Array<{
    id: string
    title: string
    order: number
    lessons: Array<{
      id: string
      title: string
      order: number
    }>
  }>
}

interface QuizRaw {
  id: string
  lesson_id: string | null
  course_id: string | null
  scope: 'lesson' | 'course'
  title: string
  pass_score: number
  attempts_allowed: number
  questions: Array<{ id: string }>
}

function toQuizSummary(quiz: QuizRaw | undefined): QuizSummary | null {
  if (!quiz) return null
  return {
    id: quiz.id,
    title: quiz.title,
    passScore: quiz.pass_score,
    attemptsAllowed: quiz.attempts_allowed,
    questionCount: quiz.questions?.length ?? 0,
  }
}

export default async function AdminAvaliacoesPage({ searchParams }: PageProps) {
  const supabase = createClient()

  const [{ data: coursesData, error: coursesError }, { data: quizzesData, error: quizzesError }] =
    await Promise.all([
      supabase
        .from('courses')
        .select(`
          id, title, slug, published,
          modules(id, title, order,
            lessons(id, title, order)
          )
        `)
        .order('title'),
      supabase
        .from('quizzes')
        .select('id, lesson_id, course_id, scope, title, pass_score, attempts_allowed, questions(id)')
        .in('scope', ['lesson', 'course']),
    ])

  if (coursesError || quizzesError) {
    return (
      <div className="content wide">
        <div className="card card-pad">
          <h1 style={{ fontSize: '22px', marginBottom: '10px' }}>Erro ao carregar avaliações</h1>
          <p className="muted" style={{ marginBottom: '10px' }}>
            O banco recusou a query da Central de Avaliações.
          </p>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '13px' }}>
            {coursesError?.message ?? quizzesError?.message}
          </pre>
        </div>
      </div>
    )
  }

  const coursesRaw = (coursesData ?? []) as unknown as CourseRaw[]
  const quizzesRaw = (quizzesData ?? []) as unknown as QuizRaw[]
  const courseQuizByCourseId = new Map(
    quizzesRaw
      .filter((quiz) => quiz.scope === 'course' && quiz.course_id)
      .map((quiz) => [quiz.course_id as string, quiz])
  )
  const lessonQuizByLessonId = new Map(
    quizzesRaw
      .filter((quiz) => quiz.scope === 'lesson' && quiz.lesson_id)
      .map((quiz) => [quiz.lesson_id as string, quiz])
  )

  const courses: AvaliacoesCourse[] = coursesRaw.map((course) => ({
    id: course.id,
    title: course.title,
    slug: course.slug,
    published: course.published ?? false,
    moduleCount: course.modules?.length ?? 0,
    lessonCount:
      course.modules?.reduce((sum, module) => sum + (module.lessons?.length ?? 0), 0) ?? 0,
    finalQuiz: toQuizSummary(courseQuizByCourseId.get(course.id)),
  }))

  const lessonQuizzes: LessonQuiz[] = coursesRaw.flatMap((course) =>
    (course.modules ?? []).flatMap((module) =>
      (module.lessons ?? []).flatMap((lesson) => {
        const quiz = lessonQuizByLessonId.get(lesson.id)
        if (!quiz) return []
        return {
          id: quiz.id,
          courseId: course.id,
          courseTitle: course.title,
          moduleTitle: module.title,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          title: quiz.title,
          passScore: quiz.pass_score,
          attemptsAllowed: quiz.attempts_allowed,
          questionCount: quiz.questions?.length ?? 0,
        }
      })
    )
  )

  return (
    <AdminAvaliacoesClient
      courses={courses}
      lessonQuizzes={lessonQuizzes}
      initialCourseId={searchParams?.courseId}
    />
  )
}
