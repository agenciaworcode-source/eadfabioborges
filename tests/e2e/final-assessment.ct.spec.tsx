import { test, expect } from '@playwright/experimental-ct-react'
import { FinalAssessmentPanel } from '@/components/player/FinalAssessmentPanel'
import type { QuizData } from '@/hooks/use-quiz'

const finalQuiz: QuizData = {
  id: 'final-quiz-1',
  lesson_id: null,
  course_id: 'course-1',
  scope: 'course',
  title: 'Prova final do curso',
  pass_score: 80,
  attempts_allowed: 2,
  questions: [
    {
      id: 'q1',
      quiz_id: 'final-quiz-1',
      type: 'multiple_choice',
      body: 'Qual tecnologia usa ultrassom?',
      options: ['HIFU', 'Radiofrequencia', 'Criolipolise', 'Peeling'],
    },
    {
      id: 'q2',
      quiz_id: 'final-quiz-1',
      type: 'true_false',
      body: 'A prova final so libera apos concluir as aulas.',
      options: [],
    },
    {
      id: 'q3',
      quiz_id: 'final-quiz-1',
      type: 'open',
      body: 'Descreva o cuidado final com o paciente.',
      options: [],
    },
  ],
}

test('prova final aparece bloqueada enquanto existem aulas pendentes', async ({ mount, page }) => {
  await mount(
    <FinalAssessmentPanel
      quiz={finalQuiz}
      completedLessons={1}
      totalLessons={3}
      result={null}
      attemptsRemaining={2}
      isSubmitting={false}
      onSubmit={async () => {}}
      onRetry={() => {}}
    />
  )

  await expect(page.getByText('Prova final', { exact: true })).toBeVisible()
  await expect(
    page.getByText('Conclua todas as aulas para liberar a prova final deste curso.')
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Enviar respostas' })).toHaveCount(0)
})

test('prova final libera ao completar aulas e envia respostas do aluno', async ({
  mount,
  page,
}) => {
  let submittedAnswers: Record<string, string> | null = null

  await mount(
    <FinalAssessmentPanel
      quiz={finalQuiz}
      completedLessons={3}
      totalLessons={3}
      result={null}
      attemptsRemaining={2}
      isSubmitting={false}
      onSubmit={async (answers) => {
        submittedAnswers = answers
      }}
      onRetry={() => {}}
    />
  )

  const submitButton = page.getByRole('button', { name: 'Enviar respostas' })
  await expect(submitButton).toBeDisabled()

  await page.getByText('HIFU').click()
  await page.getByText('Verdadeiro').click()
  await page
    .getByPlaceholder('Escreva sua resposta aqui...')
    .fill('Registrar evolucao e orientar retorno.')
  await expect(submitButton).toBeEnabled()
  await submitButton.click()

  await expect
    .poll(() => submittedAnswers)
    .toEqual({
      q1: 'HIFU',
      q2: 'Verdadeiro',
      q3: 'Registrar evolucao e orientar retorno.',
    })
})
