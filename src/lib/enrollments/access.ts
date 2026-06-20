import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type DbClient = SupabaseClient<Database>

export function calculateEnrollmentExpiresAt(
  enrolledAtIso: string,
  accessDays: number | null | undefined,
): string | null {
  if (!accessDays || accessDays <= 0) return null

  const expiresAt = new Date(enrolledAtIso)
  expiresAt.setDate(expiresAt.getDate() + accessDays)
  return expiresAt.toISOString()
}

export async function createEnrollmentWithAccessWindow(
  supabase: DbClient,
  input: { userId: string; courseId: string; enrollmentId?: string },
): Promise<{
  enrollmentId: string
  enrolledAt: string
  expiresAt: string | null
  error: string | null
}> {
  const enrolledAt = new Date().toISOString()

  const { data: courseData, error: courseError } = await supabase
    .from('courses')
    .select('access_days')
    .eq('id', input.courseId)
    .maybeSingle()

  if (courseError) {
    return {
      enrollmentId: input.enrollmentId ?? '',
      enrolledAt,
      expiresAt: null,
      error: courseError.message,
    }
  }

  const accessDays =
    (courseData as { access_days: number | null } | null)?.access_days ?? null
  const expiresAt = calculateEnrollmentExpiresAt(enrolledAt, accessDays)

  const insertPayload: Record<string, unknown> = {
    user_id: input.userId,
    course_id: input.courseId,
    status: 'active',
    enrolled_at: enrolledAt,
    expires_at: expiresAt,
  }

  if (input.enrollmentId) insertPayload.id = input.enrollmentId

  const { data: enrollmentData, error: insertError } = await supabase
    .from('enrollments')
    .insert(insertPayload as never)
    .select('id, enrolled_at, expires_at')
    .single()

  if (insertError) {
    return {
      enrollmentId: input.enrollmentId ?? '',
      enrolledAt,
      expiresAt,
      error: insertError.message,
    }
  }

  const enrollment = enrollmentData as unknown as {
    id: string
    enrolled_at: string
    expires_at: string | null
  }

  return {
    enrollmentId: enrollment.id,
    enrolledAt: enrollment.enrolled_at,
    expiresAt: enrollment.expires_at,
    error: null,
  }
}
