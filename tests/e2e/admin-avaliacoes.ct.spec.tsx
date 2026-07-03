import { test, expect } from '@playwright/experimental-ct-react'
import {
  AdminAvaliacoesClient,
  type AvaliacoesCourse,
} from '@/components/admin/AdminAvaliacoesClient'

const courses: AvaliacoesCourse[] = [
  {
    id: 'course-1',
    title: 'Curso de Estetica Avancada',
    slug: 'estetica-avancada',
    published: true,
    moduleCount: 2,
    lessonCount: 8,
    finalQuiz: null,
  },
]

test('admin cria prova final de curso e cadastra perguntas multipla escolha, verdadeiro/falso e dissertativa', async ({
  mount,
  page,
}) => {
  const createdQuizPayloads: unknown[] = []
  const createdQuestions: Array<Record<string, unknown>> = []

  await page.route('**/api/admin/courses/course-1/quiz', async (route) => {
    const request = route.request()

    if (request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'null',
      })
      return
    }

    createdQuizPayloads.push(request.postDataJSON())
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'quiz-course-1',
        lesson_id: null,
        course_id: 'course-1',
        scope: 'course',
        title: 'Prova final - Estetica Avancada',
        pass_score: 80,
        attempts_allowed: 2,
      }),
    })
  })

  await page.route('**/api/admin/quizzes/quiz-course-1/questions', async (route) => {
    const payload = route.request().postDataJSON() as Record<string, unknown>
    createdQuestions.push(payload)

    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        id: `question-${createdQuestions.length}`,
        quiz_id: 'quiz-course-1',
        ...payload,
      }),
    })
  })

  await mount(
    <AdminAvaliacoesClient courses={courses} lessonQuizzes={[]} initialCourseId="course-1" />
  )

  await expect(page.getByRole('button', { name: /Curso de Estetica Avancada/ })).toBeVisible()
  await expect(page.getByText('Geral do curso')).toBeVisible()

  await page.getByPlaceholder(/Prova final/i).fill('Prova final - Estetica Avancada')
  await page.locator('input[type="number"]').nth(0).fill('80')
  await page.locator('input[type="number"]').nth(1).fill('2')
  await page.getByRole('button', { name: 'Criar quiz' }).click()

  await expect
    .poll(() => createdQuizPayloads)
    .toEqual([
      {
        title: 'Prova final - Estetica Avancada',
        pass_score: 80,
        attempts_allowed: 2,
      },
    ])
  await expect(page.getByText('80%')).toBeVisible()
  await expect(page.getByText('2 tent.')).toBeVisible()

  await page.getByRole('button', { name: /^\+ Adicionar/ }).click()
  await page.getByPlaceholder(/Qual tecnologia/i).fill('Qual tecnologia usa ultrassom?')
  await page.locator('input[placeholder^="Op"]').nth(0).fill('HIFU')
  await page.locator('input[placeholder^="Op"]').nth(1).fill('Radiofrequencia')
  await page.locator('input[placeholder^="Op"]').nth(2).fill('Criolipolise')
  await page.locator('input[placeholder^="Op"]').nth(3).fill('Peeling')
  await page.locator('select').nth(1).selectOption('HIFU')
  await page.getByRole('button', { name: /^Adicionar/ }).click()
  await expect(page.getByText('Qual tecnologia usa ultrassom?')).toBeVisible()

  await page.getByRole('button', { name: /^\+ Adicionar/ }).click()
  await page.locator('select').first().selectOption('true_false')
  await page.getByPlaceholder(/Qual tecnologia/i).fill('Criolipolise pode ser feita sem avaliacao.')
  await page.getByLabel('Falso').check()
  await page.getByRole('button', { name: /^Adicionar/ }).click()
  await expect(page.getByText('Criolipolise pode ser feita sem avaliacao.')).toBeVisible()

  await page.getByRole('button', { name: /^\+ Adicionar/ }).click()
  await page.locator('select').first().selectOption('open')
  await page.getByPlaceholder(/Qual tecnologia/i).fill('Descreva o protocolo de seguranca.')
  await page.getByRole('button', { name: /^Adicionar/ }).click()
  await expect(page.getByText('Descreva o protocolo de seguranca.')).toBeVisible()

  expect(createdQuestions).toEqual([
    {
      type: 'multiple_choice',
      body: 'Qual tecnologia usa ultrassom?',
      options: ['HIFU', 'Radiofrequencia', 'Criolipolise', 'Peeling'],
      correct_answer: 'HIFU',
    },
    {
      type: 'true_false',
      body: 'Criolipolise pode ser feita sem avaliacao.',
      options: [],
      correct_answer: 'false',
    },
    {
      type: 'open',
      body: 'Descreva o protocolo de seguranca.',
      options: [],
      correct_answer: null,
    },
  ])
})
