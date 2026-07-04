// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createHmac } from 'crypto'

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

function makeRequest(rawBody: string, signature?: string): Request {
  return {
    text: async () => rawBody,
    headers: {
      get: (name: string) => (name.toLowerCase() === 'x-hub-signature' ? (signature ?? '') : null),
    },
  } as unknown as Request
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex')
}

const SECRET = 'test-webhook-secret'

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/webhooks/pagarme — verificação de assinatura (regressão S3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('rejeita (401) quando secret está setado e a assinatura é inválida', async () => {
    vi.stubEnv('PAGARME_WEBHOOK_SECRET', SECRET)

    const body = JSON.stringify({ type: 'order.paid', data: { id: 'or_1', metadata: {} } })
    const res = await POST(makeRequest(body, 'assinatura-errada'))

    expect(res.status).toBe(401)
  })

  it('rejeita (401) quando secret está setado e não há header de assinatura', async () => {
    vi.stubEnv('PAGARME_WEBHOOK_SECRET', SECRET)

    const body = JSON.stringify({ type: 'order.paid', data: { id: 'or_1', metadata: {} } })
    const res = await POST(makeRequest(body))

    expect(res.status).toBe(401)
  })

  it('FAIL-CLOSED: rejeita (401) em produção quando o secret não está configurado', async () => {
    vi.stubEnv('PAGARME_WEBHOOK_SECRET', '')
    vi.stubEnv('NODE_ENV', 'production')

    const body = JSON.stringify({ type: 'order.paid', data: { id: 'or_1', metadata: {} } })
    const res = await POST(makeRequest(body, 'qualquer-coisa'))

    expect(res.status).toBe(401)
  })

  it('aceita assinatura válida e ignora evento não-order.paid (handled: false)', async () => {
    vi.stubEnv('PAGARME_WEBHOOK_SECRET', SECRET)

    const body = JSON.stringify({ type: 'charge.updated', data: { id: 'or_1', metadata: {} } })
    const res = await POST(makeRequest(body, sign(body, SECRET)))

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toMatchObject({ received: true, handled: false })
  })

  it('fora de produção, aceita sem secret (conveniência de dev)', async () => {
    vi.stubEnv('PAGARME_WEBHOOK_SECRET', '')
    vi.stubEnv('NODE_ENV', 'test')

    const body = JSON.stringify({ type: 'charge.updated', data: { id: 'or_1', metadata: {} } })
    const res = await POST(makeRequest(body, ''))

    expect(res.status).toBe(200)
  })
})
