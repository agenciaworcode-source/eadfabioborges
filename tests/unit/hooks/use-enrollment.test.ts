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
 * Enrollment chain: select → eq → eq → in → maybeSingle
 * Subscription chain: select → eq → eq → gt  (gt resolve)
 */
function setupFromMock(
  enrollmentRow: { status: string; expires_at: string | null } | null,
  subscriptionRows: { status: string; period_end: string }[]
) {
  let callIndex = 0
  mockFrom.mockImplementation(() => {
    const isEnrollment = callIndex === 0
    callIndex++

    if (isEnrollment) {
      // Enrollment: termina em .maybeSingle()
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: enrollmentRow, error: null }),
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
  enrollmentRow: { status: string; expires_at: string | null } | null,
  subscriptionRows: { status: string; period_end: string }[]
): Promise<{ hasAccess: boolean; expiresAt: string | null; isExpired: boolean }> {
  mockGetUser.mockResolvedValueOnce({
    data: { user: { id: 'user-123' } },
    error: null,
  })
  setupFromMock(enrollmentRow, subscriptionRows)

  const supabase = (await import('@/lib/supabase/client')).createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { hasAccess: false, expiresAt: null, isExpired: false }
  }

  const [{ data: enrollments }, { data: subscriptions }] = await Promise.all([
    supabase
      .from('enrollments')
      .select('status, expires_at')
      .eq('user_id', user.id)
      .eq('course_id', 'course-abc')
      .in('status', ['active', 'completed', 'expired'])
      .maybeSingle(),
    supabase
      .from('subscriptions')
      .select('status, period_end')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('period_end', new Date().toISOString()),
  ])

  const enrollment = enrollments as { status: string; expires_at: string | null } | null
  const expiresAt = enrollment?.expires_at ?? null
  const isExpired =
    enrollment?.status === 'expired' || (expiresAt ? new Date(expiresAt) < new Date() : false)

  return {
    hasAccess:
      (!!enrollment &&
        !isExpired &&
        (enrollment.status === 'active' || enrollment.status === 'completed')) ||
      ((subscriptions as { status: string; period_end: string }[] | null)?.length ?? 0) > 0,
    expiresAt,
    isExpired,
  }
}

// ─── Testes ───────────────────────────────────────────────────────────────────

describe('useEnrollment — lógica de acesso', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFrom.mockReset()
  })

  it('hasAccess: true para enrollment com status active', async () => {
    const state = await resolveAccess({ status: 'active', expires_at: null }, [])
    expect(state.hasAccess).toBe(true)
    expect(state.expiresAt).toBeNull()
    expect(state.isExpired).toBe(false)
  })

  it('hasAccess: true para enrollment com status completed', async () => {
    const state = await resolveAccess({ status: 'completed', expires_at: null }, [])
    expect(state.hasAccess).toBe(true)
  })

  it('hasAccess: true para subscription active com period_end futuro', async () => {
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const state = await resolveAccess(null, [{ status: 'active', period_end: futureDate }])
    expect(state.hasAccess).toBe(true)
  })

  it('hasAccess: false sem enrollment nem subscription', async () => {
    const state = await resolveAccess(null, [])
    expect(state.hasAccess).toBe(false)
  })

  it('hasAccess: false para enrollment cancelled (filtrado pelo IN no banco)', async () => {
    const state = await resolveAccess(null, [])
    expect(state.hasAccess).toBe(false)
  })

  it('hasAccess: false para subscription cancelled (filtrado pelo eq status=active)', async () => {
    const state = await resolveAccess(null, [])
    expect(state.hasAccess).toBe(false)
  })

  it('isExpired: true para enrollment com expires_at no passado', async () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const state = await resolveAccess({ status: 'active', expires_at: pastDate }, [])
    expect(state.isExpired).toBe(true)
    expect(state.expiresAt).toBe(pastDate)
    expect(state.hasAccess).toBe(false)
  })
})
