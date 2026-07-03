import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { ensureCourseEnrollmentForAccess, hasCourseAccess } from '@/lib/courses/access'
import { issueCertificate } from '@/lib/certificates/issue'

const submitSchema = z.object({
  quizId: z.string().uuid(),
  answers: z.record(z.string(), z.string()),
})

interface QuestionRow {
  id: string
  type: 'multiple_choice' | 'true_false' | 'open'
  correct_answer: string | null
}

interface QuizRow {
  id: string
  lesson_id: string | null
  course_id: string | null
  scope: 'lesson' | 'course'
  pass_score: number
  attempts_allowed: number
  questions: QuestionRow[]
}

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

  const parsed = submitSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { quizId, answers } = parsed.data

  // Buscar quiz com questões
  const { data: quizData, error: quizError } = await supabase
    .from('quizzes')
    .select(
      'id, lesson_id, course_id, scope, pass_score, attempts_allowed, questions(id, type, correct_answer)'
    )
    .eq('id', quizId)
    .single()

  if (quizError || !quizData) {
    return NextResponse.json({ error: 'Quiz não encontrado' }, { status: 404 })
  }

  const quiz = quizData as unknown as QuizRow

  if (quiz.scope === 'course') {
    if (!quiz.course_id) {
      return NextResponse.json({ error: 'Prova final sem curso vinculado' }, { status: 422 })
    }

    const canSubmitFinal = await hasCompletedAllCourseLessons(supabase, user.id, quiz.course_id)

    if (!canSubmitFinal) {
      return NextResponse.json(
        { error: 'Conclua todas as aulas antes de realizar a prova final' },
        { status: 403 }
      )
    }
  }

  // Contar tentativas anteriores
  const { count: attemptsUsed } = await supabase
    .from('quiz_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('quiz_id', quizId)

  const usedCount = attemptsUsed ?? 0

  if (usedCount >= quiz.attempts_allowed) {
    return NextResponse.json({ error: 'Limite de tentativas atingido' }, { status: 400 })
  }

  // Calcular nota — apenas multiple_choice e true_false
  const gradableQuestions = quiz.questions.filter(
    (q) => q.type === 'multiple_choice' || q.type === 'true_false'
  )

  let correctCount = 0
  for (const q of gradableQuestions) {
    if (q.correct_answer && answers[q.id] === q.correct_answer) {
      correctCount++
    }
  }

  const score =
    gradableQuestions.length > 0 ? Math.round((correctCount / gradableQuestions.length) * 100) : 0

  const passed = score >= quiz.pass_score

  // Inserir tentativa de forma atômica no banco para evitar corrida entre submissões simultâneas
  const { data: attemptResult, error: attemptError } = await createServiceClient().rpc(
    'submit_quiz_attempt',
    {
      p_quiz_id: quizId,
      p_user_id: user.id,
      p_score: score,
      p_passed: passed,
      p_answers: answers,
    }
  )

  if (attemptError) {
    const status = attemptError.message.includes('Limite de tentativas') ? 400 : 500
    return NextResponse.json({ error: attemptError.message }, { status })
  }

  let courseCompleted = false
  if (quiz.scope === 'course' && quiz.course_id && passed) {
    courseCompleted = await completeCourseEnrollment(user.id, user.email ?? null, quiz.course_id)
  }

  const attemptsResult = Array.isArray(attemptResult) ? attemptResult[0] : attemptResult
  const newAttemptsUsed = attemptsResult?.attempts_used ?? usedCount + 1
  const attemptsAllowed = quiz.attempts_allowed

  // Retornar gabarito apenas se aprovado ou última tentativa esgotada
  const revealAnswers = passed || newAttemptsUsed >= attemptsAllowed
  const correctAnswers: Record<string, string> | undefined = revealAnswers
    ? Object.fromEntries(
        quiz.questions
          .filter((q) => q.correct_answer !== null)
          .map((q) => [q.id, q.correct_answer as string])
      )
    : undefined

  return NextResponse.json({
    score,
    passed,
    attemptsUsed: newAttemptsUsed,
    attemptsAllowed,
    courseCompleted,
    correctAnswers,
  })
}

async function hasCompletedAllCourseLessons(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  courseId: string
) {
  const canAccessCourse = await hasCourseAccess(supabase, { userId, courseId })
  if (!canAccessCourse) return false

  const { data: modulesData } = await supabase
    .from('modules')
    .select('id, lessons(id)')
    .eq('course_id', courseId)

  const modules = (modulesData ?? []) as unknown as ModuleRow[]
  const lessonIds = modules.flatMap((module) => (module.lessons ?? []).map((lesson) => lesson.id))

  if (lessonIds.length === 0) return true

  const { data: progressData } = await supabase
    .from('lesson_progress')
    .select('lesson_id, completed')
    .eq('user_id', userId)
    .in('lesson_id', lessonIds)

  const progress = (progressData ?? []) as unknown as LessonProgressRow[]
  const completedIds = new Set(progress.filter((row) => row.completed).map((row) => row.lesson_id))

  return lessonIds.every((lessonId) => completedIds.has(lessonId))
}

async function completeCourseEnrollment(
  userId: string,
  userEmail: string | null,
  courseId: string
) {
  try {
    const service = createServiceClient()
    const { error } = await ensureCourseEnrollmentForAccess(service, {
      userId,
      courseId,
      status: 'completed',
    })

    if (error) return false

    const { data: profileData } = await service
      .from('users')
      .select('name')
      .eq('id', userId)
      .maybeSingle()

    const userName =
      (profileData as { name: string } | null)?.name || userEmail?.split('@')[0] || 'Aluno'

    void issueCertificate({ userId, userEmail, userName, courseId })

    return true
  } catch {
    return false
  }
}
