'use client'

import { CheckCircle2, XCircle } from 'lucide-react'
import type { SubmitResult } from '@/hooks/use-quiz'

interface QuizResultProps {
  result: SubmitResult
  attemptsRemaining: number
  onRetry: () => void
}

export function QuizResult({ result, attemptsRemaining, onRetry }: QuizResultProps) {
  const { score, passed, attemptsUsed, attemptsAllowed, correctAnswers } = result

  return (
    <div
      className="p-6"
      style={{ background: '#f2f2f2', borderTop: '1px solid #e6e6e8' }}
    >
      {/* Cabeçalho resultado */}
      <div className="flex items-center gap-4">
        {passed ? (
          <div
            className="grid h-14 w-14 flex-none place-items-center rounded-full"
            style={{ background: 'rgba(23,138,74,.12)' }}
          >
            <CheckCircle2 className="h-7 w-7" style={{ color: '#178a4a' }} />
          </div>
        ) : (
          <div
            className="grid h-14 w-14 flex-none place-items-center rounded-full"
            style={{ background: 'rgba(220,53,53,.1)' }}
          >
            <XCircle className="h-7 w-7" style={{ color: '#dc3535' }} />
          </div>
        )}

        <div>
          <p
            className="text-3xl font-bold"
            style={{ color: '#1d1d1f', letterSpacing: '-0.04em' }}
          >
            {score}
            <span className="text-base font-normal" style={{ color: '#6e6e73' }}>
              /100
            </span>
          </p>
          <p
            className="mt-0.5 text-sm font-semibold"
            style={{ color: passed ? '#178a4a' : '#dc3535' }}
          >
            {passed ? 'Aprovado ✓' : 'Reprovado ✗'}
          </p>
        </div>

        <div className="ml-auto text-right text-xs" style={{ color: '#6e6e73' }}>
          <p>
            Tentativa {attemptsUsed} de {attemptsAllowed}
          </p>
          {attemptsRemaining > 0 && (
            <p>
              {attemptsRemaining} tentativa{attemptsRemaining > 1 ? 's' : ''} restante
              {attemptsRemaining > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Gabarito */}
      {correctAnswers && Object.keys(correctAnswers).length > 0 && (
        <div
          className="mt-5 rounded-xl p-4"
          style={{ background: '#fff', border: '1px solid #e6e6e8' }}
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#6e6e73' }}>
            Gabarito
          </p>
          <div className="flex flex-col gap-2">
            {Object.entries(correctAnswers).map(([qId, correct]) => (
              <div key={qId} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 flex-none" style={{ color: '#178a4a' }} />
                <span style={{ color: '#1d1d1f' }}>{correct}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botão tentar novamente */}
      {attemptsRemaining > 0 && (
        <button
          onClick={onRetry}
          className="mt-5 w-full rounded-full border py-3 text-sm font-semibold transition"
          style={{ borderColor: '#d8d8db', color: '#1d1d1f' }}
        >
          Tentar novamente
        </button>
      )}

      {attemptsRemaining === 0 && !passed && (
        <p
          className="mt-4 text-center text-sm"
          style={{ color: '#6e6e73' }}
        >
          Você esgotou todas as tentativas. Entre em contato com o instrutor.
        </p>
      )}
    </div>
  )
}
