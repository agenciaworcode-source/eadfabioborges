import { expect, test, type Page } from '@playwright/test'

const publicRoutes = [
  { path: '/', heading: /F[aá]bio Borges|Mentoria/i },
  { path: '/planos', heading: /escolha o seu n[ií]vel/i },
  { path: '/cursos', heading: /cursos/i },
  { path: '/auth/login', heading: /bem-vinda|entrar/i },
  { path: '/auth/cadastro', heading: /criar conta/i },
  { path: '/auth/recuperar-senha', heading: /recuperar senha/i },
  { path: '/auth/nova-senha', heading: /criar nova senha/i },
  { path: '/checkout/sucesso', heading: /pagamento confirmado|aprovado/i },
  { path: '/checkout/cancelado', heading: /checkout cancelado/i },
]

function attachRuntimeGuards(page: Page) {
  const runtimeErrors: string[] = []

  page.on('console', (message) => {
    if (message.type() === 'error') {
      runtimeErrors.push(message.text())
    }
  })

  page.on('pageerror', (error) => {
    runtimeErrors.push(error.message)
  })

  return runtimeErrors
}

test.describe('public navigation smoke', () => {
  for (const route of publicRoutes) {
    test(`renders ${route.path}`, async ({ page }) => {
      const runtimeErrors = attachRuntimeGuards(page)
      const response = await page.goto(route.path)

      expect(response?.status(), route.path).toBeLessThan(500)
      await expect(page.locator('body')).toBeVisible()
      await expect(page.getByRole('heading', { name: route.heading }).first()).toBeVisible()
      expect(runtimeErrors, route.path).toEqual([])
    })
  }
})

test.describe('auth forms', () => {
  test('login validates invalid fields and keeps user on login', async ({ page }) => {
    const runtimeErrors = attachRuntimeGuards(page)
    await page.goto('/auth/login')

    await page.getByRole('button', { name: /^Entrar$/i }).click()

    await expect(page).toHaveURL(/\/auth\/login/)
    await expect(page.getByText(/e-mail inv[aá]lido/i)).toBeVisible()
    expect(runtimeErrors).toEqual([])
  })

  test('signup validates required fields and password confirmation', async ({ page }) => {
    const runtimeErrors = attachRuntimeGuards(page)
    await page.goto('/auth/cadastro')

    await page.getByLabel(/nome completo/i).fill('A')
    await page.getByLabel(/^e-mail$/i).fill('email-invalido')
    await page.getByLabel(/^senha$/i).fill('123')
    await page.getByLabel(/confirmar/i).fill('456')
    await page.getByRole('button', { name: /criar minha conta/i }).click()

    await expect(page.getByText(/nome deve ter/i)).toBeVisible()
    await expect(page.getByText(/e-mail inv[aá]lido/i)).toBeVisible()
    await expect(page.getByText(/senha deve ter/i)).toBeVisible()
    await expect(page.getByText(/as senhas n[aã]o coincidem/i)).toBeVisible()
    expect(runtimeErrors).toEqual([])
  })

  test('forgot password accepts email without leaking account existence', async ({ page }) => {
    const runtimeErrors = attachRuntimeGuards(page)
    await page.goto('/auth/recuperar-senha')

    await page.getByLabel(/^e-mail$/i).fill('teste@example.com')
    await page.getByRole('button', { name: /enviar link/i }).click()

    await expect(page.getByRole('heading', { name: /verifique seu e-mail/i })).toBeVisible()
    expect(runtimeErrors).toEqual([])
  })
})

test.describe('protected route redirects', () => {
  test('dashboard redirects anonymous user to login with returnUrl', async ({ page }) => {
    const runtimeErrors = attachRuntimeGuards(page)
    await page.goto('/dashboard')

    await expect(page).toHaveURL(/\/auth\/login\?returnUrl=(%2F|\/)dashboard/)
    await expect(page.getByRole('heading', { name: /bem-vinda|entrar/i })).toBeVisible()
    expect(runtimeErrors).toEqual([])
  })

  test('admin redirects anonymous user to login with returnUrl', async ({ page }) => {
    const runtimeErrors = attachRuntimeGuards(page)
    await page.goto('/admin')

    await expect(page).toHaveURL(/\/auth\/login\?returnUrl=(%2F|\/)admin/)
    await expect(page.getByRole('heading', { name: /bem-vinda|entrar/i })).toBeVisible()
    expect(runtimeErrors).toEqual([])
  })
})
