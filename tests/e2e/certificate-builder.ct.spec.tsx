import { test, expect } from '@playwright/experimental-ct-react'
import { AdminCertificateBuilder } from '@/components/admin/AdminCertificateBuilder'
import { DEFAULT_CERTIFICATE_TEMPLATE } from '@/lib/certificates/templates'

test('admin edita textos, cor e salva template de certificado', async ({ mount, page }) => {
  const savedPayloads: unknown[] = []

  await page.route('**/api/admin/certificates/template', async (route) => {
    savedPayloads.push(route.request().postDataJSON())
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        template: {
          ...DEFAULT_CERTIFICATE_TEMPLATE,
          ...route.request().postDataJSON(),
          id: '7a6f0b1c-8d9e-4f10-9a11-123456789abc',
        },
      }),
    })
  })

  await mount(<AdminCertificateBuilder template={DEFAULT_CERTIFICATE_TEMPLATE} />)

  await page.getByLabel('Título').fill('Certificado VIP')
  await page.getByLabel('Texto').fill('{{student_name}} finalizou {{course_name}} com excelência.')
  await page.getByLabel('Nome do emissor').fill('Fabio Borges')
  await page.getByLabel('Cargo/descrição').fill('Diretor Academico')
  await page.getByRole('button', { name: 'Salvar template' }).click()

  await expect(page.getByText('Certificado VIP')).toBeVisible()
  await expect(
    page.getByText('Maria Silva finalizou Curso Avançado de Estética com excelência.')
  ).toBeVisible()
  await expect(page.getByText('Template salvo.')).toBeVisible()
  await expect.poll(() => savedPayloads.length).toBe(1)
})
