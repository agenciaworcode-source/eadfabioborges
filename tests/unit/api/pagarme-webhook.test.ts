// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ─── Mocks de dependências (evitam efeitos colaterais de DB/e-mail) ───────────

const mockServiceFrom = vi.fn()
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({ from: mockServiceFrom }),
}))

vi.mock('@/lib/enrollments/access', () => ({
  createEnrollmentWithAccessWindow: vi
    .fn()
    .mockResolvedValue({ enrollmentId: 'enr-1', error: null }),
}))

vi.mock('@/lib/resend', () => ({ sendEmail: vi.fn() }))
vi.mock('@/emails/CompraConfirmadaCursoEmail', () => ({ CompraConfirmadaCursoEmail: () => null }))
vi.mock('@/emails/AssinaturaConfirmadaEmail', () => ({ AssinaturaConfirmadaEmail: () => null }))

vi.mock('next/server', async () => {
  const actual = await vi.importActual<typeof import('next/server')>('next/server')
  return {
    ...actual,
    NextResponse: {
      json: (data: unknown, init?: ResponseInit) => ({
        status: init?.status ?? 200,
        _data: data,
        json: async () => data,
      }),
    },
  }
})

// ─── Import após mocks ────────────────────────────────────────────────────────

import { POST } from '@/app/api/webhooks/pagarme/route'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(rawBody: string, authHeader?: string): Request {
  return {
    text: async () => rawBody,
    headers: {
      get: (name: string) => (name.toLowerCase() === 'authorization' ? (authHeader ?? null) : null),
    },
  } as unknown as Request
}

function basic(user: string, pass: string): string {
  return 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64')
}

const USER = 'pagarme-hook'
const PASS = 'senha-super-secreta'

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/webhooks/pagarme — autenticação Basic Auth (regressão S3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('rejeita (401) quando credenciais estão setadas e a senha é inválida', async () => {
    vi.stubEnv('PAGARME_WEBHOOK_USER', USER)
    vi.stubEnv('PAGARME_WEBHOOK_PASSWORD', PASS)

    const body = JSON.stringify({ type: 'order.paid', data: { id: 'or_1', metadata: {} } })
    const res = await POST(makeRequest(body, basic(USER, 'senha-errada')))

    expect(res.status).toBe(401)
  })

  it('rejeita (401) quando credenciais estão setadas e não há header Authorization', async () => {
    vi.stubEnv('PAGARME_WEBHOOK_USER', USER)
    vi.stubEnv('PAGARME_WEBHOOK_PASSWORD', PASS)

    const body = JSON.stringify({ type: 'order.paid', data: { id: 'or_1', metadata: {} } })
    const res = await POST(makeRequest(body))

    expect(res.status).toBe(401)
  })

  it('FAIL-CLOSED: rejeita (401) em produção quando as credenciais não estão configuradas', async () => {
    vi.stubEnv('PAGARME_WEBHOOK_USER', '')
    vi.stubEnv('PAGARME_WEBHOOK_PASSWORD', '')
    vi.stubEnv('NODE_ENV', 'production')

    const body = JSON.stringify({ type: 'order.paid', data: { id: 'or_1', metadata: {} } })
    const res = await POST(makeRequest(body, basic(USER, PASS)))

    expect(res.status).toBe(401)
  })

  it('aceita Basic Auth válido e ignora evento não-order.paid (handled: false)', async () => {
    vi.stubEnv('PAGARME_WEBHOOK_USER', USER)
    vi.stubEnv('PAGARME_WEBHOOK_PASSWORD', PASS)

    const body = JSON.stringify({ type: 'charge.updated', data: { id: 'or_1', metadata: {} } })
    const res = await POST(makeRequest(body, basic(USER, PASS)))

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toMatchObject({ received: true, handled: false })
  })

  it('fora de produção, aceita sem credenciais (conveniência de dev)', async () => {
    vi.stubEnv('PAGARME_WEBHOOK_USER', '')
    vi.stubEnv('PAGARME_WEBHOOK_PASSWORD', '')
    vi.stubEnv('NODE_ENV', 'test')

    const body = JSON.stringify({ type: 'charge.updated', data: { id: 'or_1', metadata: {} } })
    const res = await POST(makeRequest(body))

    expect(res.status).toBe(200)
  })

  it('registra pagamento no ledger (idempotente, valor real) ao processar order.paid', async () => {
    vi.stubEnv('PAGARME_WEBHOOK_USER', USER)
    vi.stubEnv('PAGARME_WEBHOOK_PASSWORD', PASS)

    const upsertSpy = vi.fn().mockResolvedValue({ error: null })
    mockServiceFrom.mockImplementation((table: string) => {
      if (table === 'payments') return { upsert: upsertSpy }
      // Cadeia genérica p/ enrollments/users (idempotência e e-mail)
      const chain: Record<string, unknown> = {}
      Object.assign(chain, {
        select: () => chain,
        eq: () => chain,
        in: () => chain,
        update: () => chain,
        maybeSingle: async () => ({ data: null }),
        single: async () => ({ data: { name: 'QA', email: 'qa@x.com' } }),
      })
      return chain
    })

    const body = JSON.stringify({
      id: 'evt-1',
      type: 'order.paid',
      data: {
        id: 'or_ledger_1',
        code: 'X',
        status: 'paid',
        amount: 99700,
        charges: [{ payment_method: 'credit_card' }],
        metadata: { type: 'course', userId: 'u1', courseId: 'c1' },
      },
    })
    const res = await POST(makeRequest(body, basic(USER, PASS)))

    expect(res.status).toBe(200)
    expect(upsertSpy).toHaveBeenCalledTimes(1)
    const [row, opts] = upsertSpy.mock.calls[0] as [
      Record<string, unknown>,
      Record<string, unknown>,
    ]
    expect(row).toMatchObject({
      provider_order_id: 'or_ledger_1',
      amount_cents: 99700,
      kind: 'course',
      method: 'credit_card',
      status: 'paid',
    })
    expect(opts).toMatchObject({ onConflict: 'provider,provider_order_id', ignoreDuplicates: true })
  })
})
