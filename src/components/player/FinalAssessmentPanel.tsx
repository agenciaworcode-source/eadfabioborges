'use client'

import { Lock, Trophy } from 'lucide-react'
import { Quiz } from '@/components/quiz/Quiz'
import { QuizResult } from '@/components/quiz/QuizResult'
import type { QuizData, SubmitResult } from '@/hooks/use-quiz'

interface FinalAssessmentPanelProps {
  quiz: QuizData | null
  completedLessons: number
  totalLessons: number
  result: SubmitResult | null
  attemptsRemaining: number
  isSubmitting: boolean
  onSubmit: (answers: Record<string, string>) => Promise<void>
  onRetry: () => void
}

export function FinalAssessmentPanel({
  quiz,
  completedLessons,
  totalLessons,
  result,
  attemptsRemaining,
  isSubmitting,
  onSubmit,
  onRetry,
}: FinalAssessmentPanelProps) {
  if (!quiz) return null

  const allLessonsCompleted = totalLessons === 0 || completedLessons >= totalLessons

  return (
    <section style={{ background: '#f2f2f2', borderTop: '1px solid #e6e6e8' }}>
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div
            className="grid h-12 w-12 flex-none place-items-center rounded-full"
            style={{
              background: allLessonsCompleted ? 'rgba(23,138,74,.12)' : 'rgba(255,179,0,.14)',
              color: allLessonsCompleted ? '#178a4a' : '#b77900',
            }}
          >
            {allLessonsCompleted ? <Trophy className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
          </div>

          <div>
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: '#6e6e73' }}
            >
              Prova final
            </p>
            <h2 className="mt-1 text-xl font-semibold" style={{ color: '#1d1d1f' }}>
              {quiz.title}
            </h2>
            <p className="mt-1 text-sm" style={{ color: '#6e6e73' }}>
              {completedLessons}/{totalLessons} aulas concluídas · mínimo {quiz.pass_score}% ·{' '}
              {quiz.attempts_allowed} tentativa{quiz.attempts_allowed > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {!allLessonsCompleted && (
          <div
            className="mt-5 rounded-xl p-4 text-sm"
            style={{ background: '#fff', border: '1px solid #e6e6e8', color: '#6e6e73' }}
          >
            Conclua todas as aulas para liberar a prova final deste curso.
          </div>
        )}
      </div>

      {allLessonsCompleted &&
        (result ? (
          <QuizResult result={result} attemptsRemaining={attemptsRemaining} onRetry={onRetry} />
        ) : (
          <Quiz quiz={quiz} onSubmit={onSubmit} isSubmitting={isSubmitting} />
        ))}
    </section>
  )
}
