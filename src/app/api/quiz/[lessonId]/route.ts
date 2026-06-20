import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
  lesson_id: string
  title: string
  pass_score: number
  attempts_allowed: number
  questions: QuestionRow[]
}

export async function GET(
  _request: Request,
  { params }: { params: { lessonId: string } }
) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('quizzes')
    .select(
      'id, lesson_id, title, pass_score, attempts_allowed, questions(id, quiz_id, type, body, options, correct_answer)'
    )
    .eq('lesson_id', params.lessonId)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ quiz: null })
  }

  const quiz = data as unknown as QuizRow

  // Remover correct_answer das questões antes de enviar ao cliente
  const quizForClient = {
    ...quiz,
    questions: quiz.questions.map(({ correct_answer: _ca, ...q }) => q),
  }

  return NextResponse.json({ quiz: quizForClient })
}
