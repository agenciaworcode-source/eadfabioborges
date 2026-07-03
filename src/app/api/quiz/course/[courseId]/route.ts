import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { hasCourseAccess } from '@/lib/courses/access'

interface QuestionRow {
  id: string
  quiz_id: string
  type: 'multiple_choice' | 'true_false' | 'open'
  body: string
  options: string[]
  correct_answer: string | null
}

interface QuizRow {
  id: string
  lesson_id: string | null
  course_id: string
  scope: 'course'
  title: string
  pass_score: number
  attempts_allowed: number
  questions: QuestionRow[]
}

export async function GET(_request: Request, { params }: { params: { courseId: string } }) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
  }

  const canAccessCourse = await hasCourseAccess(supabase, {
    userId: user.id,
    courseId: params.courseId,
  })

  if (!canAccessCourse) {
    return NextResponse.json({ error: 'Sem acesso ao curso' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('quizzes')
    .select(
      'id, lesson_id, course_id, scope, title, pass_score, attempts_allowed, questions(id, quiz_id, type, body, options, correct_answer)'
    )
    .eq('course_id', params.courseId)
    .eq('scope', 'course')
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ quiz: null })
  }

  const quiz = data as unknown as QuizRow

  const quizForClient = {
    ...quiz,
    questions: quiz.questions.map(({ correct_answer: _correctAnswer, ...question }) => question),
  }

  return NextResponse.json({ quiz: quizForClient })
}
