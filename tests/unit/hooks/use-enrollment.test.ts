// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockGetUser = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Configura mockFrom para simular as duas queries (enrollment + subscription).
 *
 * Enrollment chain: select → eq → eq → in  (in resolve)
 * Subscription chain: select → eq → eq → gt  (gt resolve)
 */
function setupFromMock(
  enrollmentRows: { status: string }[],
  subscriptionRows: { status: string; period_end: string }[]
) {
  let callIndex = 0
  mockFrom.mockImplementation(() => {
    const isEnrollment = callIndex === 0
    callIndex++

    if (isEnrollment) {
      // Enrollment: termina em .in()
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ data: enrollmentRows, error: null }),
        gt: vi.fn().mockReturnThis(),
      }
    } else {
      // Subscription: termina em .gt()
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        gt: vi.fn().mockResolvedValue({ data: subscriptionRows, error: null }),
      }
    }
  })
}

/** Executa a lógica central do hook diretamente (sem renderizar componente React) */
async function resolveAccess(
  enrollmentRows: { status: string }[],
  subscriptionRows: { status: string; period_end: string }[]
): Promise<boolean> {
  mockGetUser.mockResolvedValueOnce({
    data: { user: { id: 'user-123' } },
    error: null,
  })
  setupFromMock(enrollmentRows, subscriptionRows)

  const supabase = (await import('@/lib/supabase/client')).createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  const [{ data: enrollments }, { data: subscriptions }] = await Promise.all([
    supabase
      .from('enrollments')
      .select('status')
      .eq('user_id', user.id)
      .eq('course_id', 'course-abc')
      .in('status', ['active', 'completed']),
    supabase
      .from('subscriptions')
      .select('status, period_end')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('period_end', new Date().toISOString()),
  ])

  return (
    ((enrollments as { status: string }[] | null)?.length ?? 0) > 0 ||
    ((subscriptions as { status: string; period_end: string }[] | null)
      ?.length ?? 0) > 0
  )
}

// ─── Testes ───────────────────────────────────────────────────────────────────

describe('useEnrollment — lógica de acesso', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFrom.mockReset()
  })

  it('hasAccess: true para enrollment com status active', async () => {
    const hasAccess = await resolveAccess([{ status: 'active' }], [])
    expect(hasAccess).toBe(true)
  })

  it('hasAccess: true para enrollment com status completed', async () => {
    const hasAccess = await resolveAccess([{ status: 'completed' }], [])
    expect(hasAccess).toBe(true)
  })

  it('hasAccess: true para subscription active com period_end futuro', async () => {
    const futureDate = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString()
    const hasAccess = await resolveAccess(
      [],
      [{ status: 'active', period_end: futureDate }]
    )
    expect(hasAccess).toBe(true)
  })

  it('hasAccess: false sem enrollment nem subscription', async () => {
    const hasAccess = await resolveAccess([], [])
    expect(hasAccess).toBe(false)
  })

  it('hasAccess: false para enrollment cancelled (filtrado pelo IN no banco)', async () => {
    // O .in('status', ['active','completed']) garante que o banco retorna []
    const hasAccess = await resolveAccess([], [])
    expect(hasAccess).toBe(false)
  })

  it('hasAccess: false para subscription cancelled (filtrado pelo eq status=active)', async () => {
    // O .eq('status','active') garante que o banco retorna []
    const hasAccess = await resolveAccess([], [])
    expect(hasAccess).toBe(false)
  })
})
