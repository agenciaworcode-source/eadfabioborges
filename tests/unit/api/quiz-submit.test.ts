// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockGetUser = vi.fn()
const mockInsert = vi.fn()
const mockMaybeSingle = vi.fn()
const mockSingle = vi.fn()
const mockSelectCount = vi.fn()

// Encadeamento flexível: from('quizzes').select(...).eq(...).single()
// e from('quiz_attempts').select(...).eq(...).eq(...) count
const mockFrom = vi.fn()

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

import { POST } from '@/app/api/quiz/submit/route'

const VALID_QUIZ_UUID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
const VALID_Q1_UUID = 'a1b2c3d4-1234-4372-a567-0e02b2c3d479'
const VALID_Q2_UUID = 'b2c3d4e5-5678-4372-a567-0e02b2c3d479'

function makeRequest(body: unknown): Request {
  return { json: async () => body } as unknown as Request
}

// Quiz com 2 questões gradable (mc + tf) e pass_score 70
const mockQuiz = {
  id: VALID_QUIZ_UUID,
  pass_score: 70,
  attempts_allowed: 3,
  questions: [
    { id: VALID_Q1_UUID, type: 'multiple_choice', correct_answer: 'A' },
    { id: VALID_Q2_UUID, type: 'true_false', correct_answer: 'Verdadeiro' },
  ],
}

describe('POST /api/quiz/submit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna 401 se usuário não autenticado', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockQuiz, error: null }),
        }),
      }),
    })

    const req = makeRequest({ quizId: VALID_QUIZ_UUID, answers: {} })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('retorna 400 se body inválido (quizId não é UUID)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    const req = makeRequest({ quizId: 'nao-uuid', answers: {} })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('retorna 400 se answers não é objeto de strings', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    const req = makeRequest({ quizId: VALID_QUIZ_UUID, answers: 'invalido' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('retorna 404 se quiz não encontrado', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
        }),
      }),
    })

    const req = makeRequest({ quizId: VALID_QUIZ_UUID, answers: {} })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })

  it('retorna 400 quando tentativas esgotadas', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    // from('quizzes') → single → mockQuiz
    // from('quiz_attempts') → count → 3 (= attempts_allowed)
    mockFrom.mockImplementation((table: string) => {
      if (table === 'quizzes') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockQuiz, error: null }),
            }),
          }),
        }
      }
      // quiz_attempts count
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: 3, error: null }),
          }),
        }),
      }
    })

    const req = makeRequest({
      quizId: VALID_QUIZ_UUID,
      answers: { [VALID_Q1_UUID]: 'A', [VALID_Q2_UUID]: 'Verdadeiro' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/tentativas/i)
  })

  it('calcula score 100 quando todas as respostas estão corretas', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'quizzes') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockQuiz, error: null }),
            }),
          }),
        }
      }
      if (table === 'quiz_attempts') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
            }),
          }),
          insert: vi.fn().mockResolvedValue({ error: null }),
        }
      }
      return {}
    })

    const req = makeRequest({
      quizId: VALID_QUIZ_UUID,
      answers: { [VALID_Q1_UUID]: 'A', [VALID_Q2_UUID]: 'Verdadeiro' },
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.score).toBe(100)
    expect(body.passed).toBe(true)
  })

  it('calcula score 50 quando metade das respostas está correta', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'quizzes') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockQuiz, error: null }),
            }),
          }),
        }
      }
      if (table === 'quiz_attempts') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
            }),
          }),
          insert: vi.fn().mockResolvedValue({ error: null }),
        }
      }
      return {}
    })

    const req = makeRequest({
      quizId: VALID_QUIZ_UUID,
      answers: { [VALID_Q1_UUID]: 'A', [VALID_Q2_UUID]: 'Falso' }, // Q2 errada
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.score).toBe(50)
    expect(body.passed).toBe(false) // 50 < 70
  })

  it('questões open não afetam o score', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    const quizWithOpen = {
      ...mockQuiz,
      questions: [
        { id: VALID_Q1_UUID, type: 'multiple_choice', correct_answer: 'A' },
        { id: VALID_Q2_UUID, type: 'open', correct_answer: null },
      ],
    }

    mockFrom.mockImplementation((table: string) => {
      if (table === 'quizzes') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: quizWithOpen, error: null }),
            }),
          }),
        }
      }
      if (table === 'quiz_attempts') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
            }),
          }),
          insert: vi.fn().mockResolvedValue({ error: null }),
        }
      }
      return {}
    })

    const req = makeRequest({
      quizId: VALID_QUIZ_UUID,
      answers: {
        [VALID_Q1_UUID]: 'A', // correta
        [VALID_Q2_UUID]: 'texto livre qualquer', // open — não afeta
      },
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    // score = 1 acerto / 1 gradable = 100
    expect(body.score).toBe(100)
    expect(body.passed).toBe(true)
  })

  it('passed=true quando score >= pass_score (70)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    // Quiz com 3 questões: 2 corretas = 66% < 70 → false; mas aqui usamos mockQuiz pass_score=70
    // Testar com exatamente 2/2 = 100 >= 70 → true (coberto no teste acima)
    // Testar limite: criar quiz com pass_score=50 e score=50
    const quizLow = { ...mockQuiz, pass_score: 50 }

    mockFrom.mockImplementation((table: string) => {
      if (table === 'quizzes') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: quizLow, error: null }),
            }),
          }),
        }
      }
      if (table === 'quiz_attempts') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
            }),
          }),
          insert: vi.fn().mockResolvedValue({ error: null }),
        }
      }
      return {}
    })

    const req = makeRequest({
      quizId: VALID_QUIZ_UUID,
      answers: { [VALID_Q1_UUID]: 'A', [VALID_Q2_UUID]: 'Falso' }, // 1/2 = 50
    })
    const res = await POST(req)
    const body = await res.json()
    expect(body.score).toBe(50)
    expect(body.passed).toBe(true) // 50 >= 50
  })
})
