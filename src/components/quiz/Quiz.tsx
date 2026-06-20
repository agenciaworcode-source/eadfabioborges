'use client'

import { useState } from 'react'
import type { QuizData } from '@/hooks/use-quiz'

interface QuizProps {
  quiz: QuizData
  onSubmit: (answers: Record<string, string>) => Promise<void>
  isSubmitting: boolean
}

export function Quiz({ quiz, onSubmit, isSubmitting }: QuizProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const allAnswered = quiz.questions.every((q) => answers[q.id] !== undefined)

  function setAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSubmit(answers)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6"
      style={{ background: '#f2f2f2', borderTop: '1px solid #e6e6e8' }}
    >
      <h2
        className="mb-5 text-lg font-semibold"
        style={{ color: '#1d1d1f', letterSpacing: '-0.02em' }}
      >
        {quiz.title}
      </h2>

      <div className="flex flex-col gap-6">
        {quiz.questions.map((question, idx) => (
          <div key={question.id}>
            <p className="mb-3 text-sm font-medium" style={{ color: '#1d1d1f' }}>
              {idx + 1}. {question.body}
            </p>

            {/* Múltipla escolha */}
            {question.type === 'multiple_choice' && (
              <div className="flex flex-col gap-2">
                {question.options.map((opt) => (
                  <label
                    key={opt}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition"
                    style={{
                      borderColor:
                        answers[question.id] === opt ? '#1d1d1f' : '#d8d8db',
                      background:
                        answers[question.id] === opt ? '#1d1d1f' : '#fff',
                      color: answers[question.id] === opt ? '#fff' : '#1d1d1f',
                    }}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={opt}
                      checked={answers[question.id] === opt}
                      onChange={() => setAnswer(question.id, opt)}
                      className="sr-only"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}

            {/* Verdadeiro / Falso */}
            {question.type === 'true_false' && (
              <div className="flex gap-3">
                {['Verdadeiro', 'Falso'].map((opt) => (
                  <label
                    key={opt}
                    className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition"
                    style={{
                      borderColor:
                        answers[question.id] === opt ? '#1d1d1f' : '#d8d8db',
                      background:
                        answers[question.id] === opt ? '#1d1d1f' : '#fff',
                      color: answers[question.id] === opt ? '#fff' : '#1d1d1f',
                    }}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={opt}
                      checked={answers[question.id] === opt}
                      onChange={() => setAnswer(question.id, opt)}
                      className="sr-only"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}

            {/* Dissertativa */}
            {question.type === 'open' && (
              <div>
                <textarea
                  value={answers[question.id] ?? ''}
                  onChange={(e) => setAnswer(question.id, e.target.value)}
                  rows={4}
                  placeholder="Escreva sua resposta aqui..."
                  className="w-full resize-none rounded-lg border px-4 py-3 text-sm outline-none transition"
                  style={{
                    borderColor: '#d8d8db',
                    color: '#1d1d1f',
                    background: '#fff',
                  }}
                />
                <p className="mt-1 text-xs" style={{ color: '#6e6e73' }}>
                  Questão dissertativa — aguarda correção manual do instrutor
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={!allAnswered || isSubmitting}
        className="mt-6 w-full rounded-full py-3 text-sm font-semibold text-white transition disabled:opacity-40"
        style={{ background: '#1d1d1f' }}
      >
        {isSubmitting ? 'Enviando...' : 'Enviar respostas'}
      </button>
    </form>
  )
}
