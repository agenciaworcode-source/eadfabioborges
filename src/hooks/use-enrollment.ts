'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

interface EnrollmentResult {
  hasAccess: boolean
  expiresAt: string | null
  isExpired: boolean
}

async function fetchEnrollment(courseId: string): Promise<EnrollmentResult> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { hasAccess: false, expiresAt: null, isExpired: false }
  }

  const [{ data: enrollment }, { data: subscriptions }] = await Promise.all([
    supabase
      .from('enrollments')
      .select('status, expires_at')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .in('status', ['active', 'completed', 'expired'])
      .maybeSingle(),
    supabase
      .from('subscriptions')
      .select('status, period_end')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('period_end', new Date().toISOString()),
  ])

  const row = enrollment as { status: string; expires_at: string | null } | null
  const now = new Date()
  const expiresAt = row?.expires_at ?? null
  const isExpired = row?.status === 'expired' || (expiresAt ? new Date(expiresAt) < now : false)

  const hasEnrollmentAccess =
    (row?.status === 'active' || row?.status === 'completed') && !isExpired
  const hasSubscriptionAccess = (subscriptions?.length ?? 0) > 0

  return {
    hasAccess: hasEnrollmentAccess || hasSubscriptionAccess,
    expiresAt,
    isExpired,
  }
}

interface UseEnrollmentResult {
  hasAccess: boolean
  isLoading: boolean
  expiresAt: string | null
  isExpired: boolean
  error: Error | null
}

export function useEnrollment(courseId: string): UseEnrollmentResult {
  const { data, isLoading, error } = useQuery({
    queryKey: ['enrollment', courseId],
    queryFn: () => fetchEnrollment(courseId),
    enabled: !!courseId,
    // Cache por 5 min — acesso raramente muda durante uma sessão
    staleTime: 5 * 60 * 1000,
    // Mantém dado anterior enquanto revalida em background
    placeholderData: (prev) => prev,
  })

  return {
    hasAccess: data?.hasAccess ?? false,
    isLoading,
    expiresAt: data?.expiresAt ?? null,
    isExpired: data?.isExpired ?? false,
    error: error as Error | null,
  }
}
