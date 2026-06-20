# 16. Estratégia de Testes

## 16.1 Pirâmide de Testes

```
         /\
        /E2E\          Playwright — 3 fluxos críticos (Sprint 7)
       /------\
      / Integr \       Vitest — API routes com Supabase test instance
     /----------\
    / Unit Tests \     Vitest — utils, generators, validators
   /--------------\
```

## 16.2 Organização dos Testes

```
tests/
├── unit/
│   ├── lib/certificate-generator.test.ts
│   ├── lib/validations.test.ts
│   └── hooks/use-progress.test.ts
├── integration/
│   ├── api/checkout.test.ts       # Stripe mock
│   ├── api/webhooks.test.ts       # Stripe mock + Supabase test DB
│   └── api/progress.test.ts
└── e2e/
    ├── fluxo-compra-curso.spec.ts
    ├── fluxo-assinatura-plano.spec.ts
    └── fluxo-conclusao-certificado.spec.ts
```

## 16.3 Exemplo de Teste E2E (Playwright)

```typescript
// tests/e2e/fluxo-compra-curso.spec.ts
import { test, expect } from '@playwright/test'

test('Fluxo completo: compra curso → acesso liberado', async ({ page }) => {
  // 1. Acessa página de curso
  await page.goto('/cursos/imersao-radiofrequencia')
  await expect(page.getByText('Imersão em Radiofrequência')).toBeVisible()

  // 2. Clica comprar (sem login → redirect)
  await page.getByRole('button', { name: 'Comprar agora' }).click()
  await expect(page).toHaveURL(/auth\/login/)

  // 3. Faz login
  await page.fill('[name=email]', 'test@playwright.com')
  await page.fill('[name=password]', 'test123')
  await page.getByRole('button', { name: 'Entrar' }).click()

  // 4. Stripe Checkout (modo test)
  await expect(page).toHaveURL(/checkout\.stripe\.com/)
  // ... preenche dados de cartão de teste Stripe

  // 5. Verifica acesso liberado
  await expect(page).toHaveURL(/dashboard\/curso/)
  await expect(page.getByTestId('vimeo-player')).toBeVisible()
})
```

---
