// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockGetUser = vi.fn()
const mockUpload = vi.fn()
const mockGetPublicUrl = vi.fn()
const mockMaybeSingle = vi.fn()
const mockSingle = vi.fn()
const mockInsert = vi.fn()

const mockStorage = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
    storage: { from: mockStorage },
  }),
}))

vi.mock('next/server', async () => {
  const actual = await vi.importActual<typeof import('next/server')>('next/server')
  return {
    ...actual,
    NextResponse: {
      json: (data: unknown, init?: ResponseInit) => ({
        status: init?.status ?? 200,
        json: async () => data,
      }),
    },
  }
})

vi.mock('crypto', () => ({
  randomUUID: () => 'test-uuid-1234',
}))

// ─── Import after mocks ────────────────────────────────────────────────────────

import { POST } from '@/app/api/assignment/upload/route'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(formData: FormData): Request {
  return { formData: async () => formData } as unknown as Request
}

function makePdfFile(name = 'test.pdf', size = 1024): File {
  const content = new Uint8Array(size)
  return new File([content], name, { type: 'application/pdf' })
}

const VALID_ASSIGNMENT_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const USER_ID = 'user-id-001'

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()

  // Default auth: authenticated
  mockGetUser.mockResolvedValue({ data: { user: { id: USER_ID } } })

  // Default assignment query: found
  mockSingle.mockResolvedValue({ data: { id: VALID_ASSIGNMENT_ID }, error: null })

  // Default existing submission: none
  mockMaybeSingle.mockResolvedValue({ data: null, error: null })

  // Default storage upload: success
  mockUpload.mockResolvedValue({ data: { path: 'test-path' }, error: null })
  mockGetPublicUrl.mockReturnValue({
    data: { publicUrl: 'https://storage.example.com/submissions/test-path' },
  })
  mockStorage.mockReturnValue({
    upload: mockUpload,
    getPublicUrl: mockGetPublicUrl,
  })

  // Default insert: success
  mockInsert.mockResolvedValue({ data: null, error: null })

  // Default from chain
  mockFrom.mockImplementation((table: string) => {
    if (table === 'assignments') {
      return {
        select: () => ({ eq: () => ({ single: mockSingle }) }),
      }
    }
    if (table === 'submissions') {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({ maybeSingle: mockMaybeSingle }),
          }),
        }),
        insert: mockInsert,
      }
    }
    return {}
  })
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/assignment/upload', () => {
  it('401 quando não autenticado', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const fd = new FormData()
    fd.append('assignmentId', VALID_ASSIGNMENT_ID)
    fd.append('file', makePdfFile())

    const res = await POST(makeRequest(fd))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Não autenticado')
  })

  it('400 quando assignmentId ausente', async () => {
    const fd = new FormData()
    fd.append('file', makePdfFile())

    const res = await POST(makeRequest(fd))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('assignmentId')
  })

  it('400 quando arquivo ausente', async () => {
    const fd = new FormData()
    fd.append('assignmentId', VALID_ASSIGNMENT_ID)

    const res = await POST(makeRequest(fd))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('Arquivo')
  })

  it('400 quando tipo de arquivo não permitido', async () => {
    const fd = new FormData()
    fd.append('assignmentId', VALID_ASSIGNMENT_ID)
    fd.append('file', new File(['content'], 'script.js', { type: 'text/javascript' }))

    const res = await POST(makeRequest(fd))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('Tipo de arquivo')
  })

  it('400 quando arquivo maior que 50 MB', async () => {
    const bigFile = new File([new Uint8Array(53_000_000)], 'big.pdf', { type: 'application/pdf' })
    const fd = new FormData()
    fd.append('assignmentId', VALID_ASSIGNMENT_ID)
    fd.append('file', bigFile)

    const res = await POST(makeRequest(fd))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('grande')
  })

  it('404 quando assignment não encontrado', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } })

    const fd = new FormData()
    fd.append('assignmentId', VALID_ASSIGNMENT_ID)
    fd.append('file', makePdfFile())

    const res = await POST(makeRequest(fd))
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toContain('não encontrada')
  })

  it('409 quando tarefa já foi enviada', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { id: 'existing-id' }, error: null })

    const fd = new FormData()
    fd.append('assignmentId', VALID_ASSIGNMENT_ID)
    fd.append('file', makePdfFile())

    const res = await POST(makeRequest(fd))
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toContain('já enviada')
  })

  it('500 quando upload do storage falha', async () => {
    mockUpload.mockResolvedValue({ data: null, error: { message: 'Storage error' } })

    const fd = new FormData()
    fd.append('assignmentId', VALID_ASSIGNMENT_ID)
    fd.append('file', makePdfFile())

    const res = await POST(makeRequest(fd))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('Storage error')
  })

  it('500 quando insert da submission falha', async () => {
    mockInsert.mockResolvedValue({ data: null, error: { message: 'DB error' } })

    const fd = new FormData()
    fd.append('assignmentId', VALID_ASSIGNMENT_ID)
    fd.append('file', makePdfFile())

    const res = await POST(makeRequest(fd))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('DB error')
  })

  it('200 com submissionId e fileUrl no upload bem-sucedido', async () => {
    const fd = new FormData()
    fd.append('assignmentId', VALID_ASSIGNMENT_ID)
    fd.append('file', makePdfFile('homework.pdf'))

    const res = await POST(makeRequest(fd))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.submissionId).toBe('test-uuid-1234')
    expect(body.fileUrl).toContain('https://storage.example.com')
  })

  it('storage upload usa path isolado por usuário', async () => {
    const fd = new FormData()
    fd.append('assignmentId', VALID_ASSIGNMENT_ID)
    fd.append('file', makePdfFile('tarefa.pdf'))

    await POST(makeRequest(fd))

    expect(mockUpload).toHaveBeenCalledWith(
      `${USER_ID}/test-uuid-1234/tarefa.pdf`,
      expect.any(ArrayBuffer),
      expect.objectContaining({ contentType: 'application/pdf', upsert: false })
    )
  })
})
