// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}))

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({
    from: mockFrom,
    storage: {
      from: () => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: null } }),
      }),
    },
  }),
}))

vi.mock('@/lib/certificate-generator', () => ({
  generateCertificatePdf: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
  uploadCertificatePdf: vi.fn().mockResolvedValue(null),
}))

vi.mock('@/lib/resend', () => ({
  sendEmail: vi.fn(),
}))

vi.mock('@/emails/CertificadoEmail', () => ({
  CertificadoEmail: vi.fn().mockReturnValue('<div />'),
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

import { POST } from '@/app/api/certificate/generate/route'

function makeRequest(body: unknown): Request {
  return { json: async () => body } as unknown as Request
}

describe('POST /api/certificate/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'a@b.com', user_metadata: {} } },
    })
  })

  it('bloqueia cursos sem certificado habilitado', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'courses') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'course-1', title: 'Curso', certificate_enabled: false },
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === 'enrollments') {
        const chain = {
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'enrollment-1',
              user_id: 'user-1',
              course_id: 'course-1',
              status: 'completed',
            },
            error: null,
          }),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }
        return { select: vi.fn().mockReturnValue(chain) }
      }
      if (table === 'certificates') {
        const chain = {
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }
        return { select: vi.fn().mockReturnValue(chain) }
      }
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { name: 'Aluno Teste' },
                error: null,
              }),
            }),
          }),
        }
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }
    })

    const res = await POST(makeRequest({ enrollmentId: 'f47ac10b-58cc-4372-a567-0e02b2c3d480' }))
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toMatch(/não emite certificado/i)
  })
})
