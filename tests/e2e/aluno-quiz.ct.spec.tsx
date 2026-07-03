import { test, expect } from '@playwright/experimental-ct-react'
import { Quiz } from '@/components/quiz/Quiz'
import type { QuizData } from '@/hooks/use-quiz'

const quiz: QuizData = {
  id: 'quiz-lesson-1',
  lesson_id: 'lesson-1',
  title: 'Quiz da aula',
  pass_score: 70,
  attempts_allowed: 3,
  questions: [
    {
      id: 'q1',
      quiz_id: 'quiz-lesson-1',
      type: 'multiple_choice',
      body: 'Qual tecnologia usa ultrassom?',
      options: ['HIFU', 'Radiofrequencia', 'Criolipolise', 'Peeling'],
    },
    {
      id: 'q2',
      quiz_id: 'quiz-lesson-1',
      type: 'true_false',
      body: 'O aluno deve assistir a aula antes de responder.',
      options: [],
    },
    {
      id: 'q3',
      quiz_id: 'quiz-lesson-1',
      type: 'open',
      body: 'Explique o cuidado pos-procedimento.',
      options: [],
    },
  ],
}

test('aluno responde quiz da aula com multipla escolha, verdadeiro/falso e dissertativa', async ({
  mount,
  page,
}) => {
  let submittedAnswers: Record<string, string> | null = null

  await mount(
    <Quiz
      quiz={quiz}
      isSubmitting={false}
      onSubmit={async (answers) => {
        submittedAnswers = answers
      }}
    />
  )

  const submitButton = page.getByRole('button', { name: 'Enviar respostas' })
  await expect(submitButton).toBeDisabled()

  await page.getByText('HIFU').click()
  await expect(submitButton).toBeDisabled()

  await page.getByText('Verdadeiro').click()
  await expect(submitButton).toBeDisabled()

  await page
    .getByPlaceholder('Escreva sua resposta aqui...')
    .fill('Usar fotoprotecao e seguir as orientacoes do instrutor.')
  await expect(submitButton).toBeEnabled()

  await submitButton.click()

  await expect
    .poll(() => submittedAnswers)
    .toEqual({
      q1: 'HIFU',
      q2: 'Verdadeiro',
      q3: 'Usar fotoprotecao e seguir as orientacoes do instrutor.',
    })
})
