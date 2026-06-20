import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type QuizAttemptInsert = Database['public']['Tables']['quiz_attempts']['Insert']

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
  pass_score: number
  attempts_allowed: number
  questions: QuestionRow[]
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
    .select('id, pass_score, attempts_allowed, questions(id, type, correct_answer)')
    .eq('id', quizId)
    .single()

  if (quizError || !quizData) {
    return NextResponse.json({ error: 'Quiz não encontrado' }, { status: 404 })
  }

  const quiz = quizData as unknown as QuizRow

  // Contar tentativas anteriores
  const { count: attemptsUsed } = await supabase
    .from('quiz_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('quiz_id', quizId)

  const usedCount = attemptsUsed ?? 0

  if (usedCount >= quiz.attempts_allowed) {
    return NextResponse.json(
      { error: 'Limite de tentativas atingido' },
      { status: 400 }
    )
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
    gradableQuestions.length > 0
      ? Math.round((correctCount / gradableQuestions.length) * 100)
      : 0

  const passed = score >= quiz.pass_score

  // Inserir tentativa
  const attemptPayload: QuizAttemptInsert = {
    user_id: user.id,
    quiz_id: quizId,
    score,
    answers: answers as unknown as never,
    passed,
  }

  const { error: insertError } = await supabase
    .from('quiz_attempts')
    .insert(attemptPayload as never)

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  const newAttemptsUsed = usedCount + 1
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
    correctAnswers,
  })
}
