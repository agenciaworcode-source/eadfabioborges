// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks de dependências ────────────────────────────────────────────────────

const mockGetUser = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({ auth: { getUser: mockGetUser } }),
}))

vi.mock('@/lib/enrollments/access', () => ({
  createEnrollmentWithAccessWindow: vi.fn().mockResolvedValue({ enrollmentId: 'e1', error: null }),
}))

vi.mock('@/lib/checkout/providers/pagarme', () => ({
  createPagarmeTransparentOrder: vi.fn(),
}))

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

import { POST } from '@/app/api/checkout/transparente/route'

const VALID_UUID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'

function makeRequest(body: unknown): Request {
  return { json: async () => body } as unknown as Request
}

// Corpo válido base (checkout de curso via PIX)
function baseBody(overrides: Record<string, unknown> = {}) {
  return {
    source: 'cart',
    items: [{ type: 'course', courseId: VALID_UUID }],
    customerName: 'Fulano de Tal',
    customerDocument: '52998224725',
    customerPhone: '11987654321',
    payment: { method: 'pix' },
    ...overrides,
  }
}

describe('POST /api/checkout/transparente — validação (regressão requisitos PagarMe)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'a@b.com' } } })
  })

  it('retorna 401 se não autenticado', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const res = await POST(makeRequest(baseBody()))
    expect(res.status).toBe(401)
  })

  it('retorna 400 se customerDocument (CPF) estiver ausente', async () => {
    const body = baseBody()
    delete (body as Record<string, unknown>).customerDocument
    const res = await POST(makeRequest(body))
    expect(res.status).toBe(400)
  })

  it('retorna 400 se customerPhone estiver ausente', async () => {
    const body = baseBody()
    delete (body as Record<string, unknown>).customerPhone
    const res = await POST(makeRequest(body))
    expect(res.status).toBe(400)
  })

  it('retorna 400 se CPF for curto demais', async () => {
    const res = await POST(makeRequest(baseBody({ customerDocument: '123' })))
    expect(res.status).toBe(400)
  })

  it('retorna 400 em pagamento com cartão sem billingAddress', async () => {
    const res = await POST(
      makeRequest(
        baseBody({
          payment: {
            method: 'credit_card',
            cardNumber: '4000000000000010',
            cardName: 'FULANO DE TAL',
            expMonth: '12',
            expYear: '2030',
            cvv: '123',
            installments: 1,
            // billingAddress ausente de propósito
          },
        })
      )
    )
    expect(res.status).toBe(400)
  })
})
