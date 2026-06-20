// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockUpsert = vi.fn()
const mockGetUser = vi.fn()

// mockFrom retorna objeto com encadeamento para upsert
const mockFrom = vi.fn().mockReturnValue({
  upsert: mockUpsert,
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
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

// ─── Import após mocks ────────────────────────────────────────────────────────

import { POST } from '@/app/api/progress/route'

// UUID v4 válido para Zod v4
const VALID_UUID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(body: unknown): Request {
  return {
    json: async () => body,
  } as unknown as Request
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/progress', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Restaurar mock de from após clearAllMocks
    mockFrom.mockReturnValue({ upsert: mockUpsert })
  })

  it('retorna 401 se usuário não autenticado', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const req = makeRequest({ lessonId: VALID_UUID, watchedSecs: 120 })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('retorna 400 se lessonId não for UUID válido', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    const req = makeRequest({ lessonId: 'nao-e-uuid', watchedSecs: 60 })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('retorna 400 se watchedSecs for negativo', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    const req = makeRequest({ lessonId: VALID_UUID, watchedSecs: -10 })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('faz upsert e retorna { updated: true } com sucesso', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockUpsert.mockResolvedValue({ error: null })

    const req = makeRequest({ lessonId: VALID_UUID, watchedSecs: 120 })
    const res = await POST(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ updated: true })
  })

  it('persiste completed: true quando passado explicitamente', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockUpsert.mockResolvedValue({ error: null })

    const req = makeRequest({ lessonId: VALID_UUID, watchedSecs: 2100, completed: true })
    await POST(req)

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ completed: true }),
      expect.any(Object)
    )
  })

  it('completed padrão é false quando não informado', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockUpsert.mockResolvedValue({ error: null })

    const req = makeRequest({ lessonId: VALID_UUID, watchedSecs: 60 })
    await POST(req)

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ completed: false }),
      expect.any(Object)
    )
  })
})
