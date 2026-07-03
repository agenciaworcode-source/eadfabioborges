'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'

export interface Question {
  id: string
  quiz_id: string
  type: 'multiple_choice' | 'true_false' | 'open'
  body: string
  options: string[]
}

export interface QuizData {
  id: string
  lesson_id: string | null
  course_id?: string | null
  scope?: 'lesson' | 'course'
  title: string
  pass_score: number
  attempts_allowed: number
  questions: Question[]
}

export interface QuizAttempt {
  id: string
  user_id: string
  quiz_id: string
  score: number
  answers: Record<string, string>
  passed: boolean
  created_at: string
}

export interface SubmitResult {
  score: number
  passed: boolean
  attemptsUsed: number
  attemptsAllowed: number
  courseCompleted?: boolean
  correctAnswers?: Record<string, string>
}

export function useQuizByLesson(lessonId: string | undefined) {
  return useQuery<{ quiz: QuizData | null }>({
    queryKey: ['quiz', 'lesson', lessonId],
    queryFn: async () => {
      const res = await fetch(`/api/quiz/${lessonId}`)
      if (!res.ok) throw new Error('Erro ao buscar quiz')
      return res.json() as Promise<{ quiz: QuizData | null }>
    },
    enabled: !!lessonId,
    staleTime: 60_000,
  })
}

export function useQuizByCourse(courseId: string | undefined) {
  return useQuery<{ quiz: QuizData | null }>({
    queryKey: ['quiz', 'course', courseId],
    queryFn: async () => {
      const res = await fetch(`/api/quiz/course/${courseId}`)
      if (!res.ok) throw new Error('Erro ao buscar prova final')
      return res.json() as Promise<{ quiz: QuizData | null }>
    },
    enabled: !!courseId,
    staleTime: 60_000,
  })
}

export function useLastAttempt(quizId: string | undefined) {
  return useQuery<{ attempt: QuizAttempt | null; attemptsUsed: number }>({
    queryKey: ['quiz', 'attempt', quizId],
    queryFn: async () => {
      const res = await fetch(`/api/quiz/attempt/${quizId}`)
      if (!res.ok) throw new Error('Erro ao buscar tentativa')
      return res.json() as Promise<{
        attempt: QuizAttempt | null
        attemptsUsed: number
      }>
    },
    enabled: !!quizId,
    staleTime: 30_000,
  })
}

export function useSubmitQuiz() {
  const queryClient = useQueryClient()

  return async function submitQuiz(
    quizId: string,
    lessonId: string | undefined,
    answers: Record<string, string>
  ): Promise<SubmitResult> {
    const res = await fetch('/api/quiz/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizId, answers }),
    })

    if (!res.ok) {
      const err = (await res.json()) as { error: string }
      throw new Error(err.error ?? 'Erro ao enviar quiz')
    }

    const result = (await res.json()) as SubmitResult

    // Invalida cache da tentativa para refletir novo resultado
    await queryClient.invalidateQueries({ queryKey: ['quiz', 'attempt', quizId] })
    if (lessonId) {
      await queryClient.invalidateQueries({ queryKey: ['quiz', 'lesson', lessonId] })
    }

    return result
  }
}
