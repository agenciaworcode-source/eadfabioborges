import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type DbClient = SupabaseClient<Database>

type EnrollmentStatus = 'active' | 'completed' | 'cancelled'

interface EnrollmentAccessRow {
  id: string
  status: EnrollmentStatus
  expires_at: string | null
}

export async function hasActiveSubscription(supabase: DbClient, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gt('period_end', new Date().toISOString())
    .limit(1)

  return (data?.length ?? 0) > 0
}

export async function isPublishedCourse(supabase: DbClient, courseId: string): Promise<boolean> {
  const { data } = await supabase
    .from('courses')
    .select('id')
    .eq('id', courseId)
    .eq('published', true)
    .maybeSingle()

  return Boolean(data)
}

function enrollmentIsValid(enrollment: EnrollmentAccessRow | null): boolean {
  if (!enrollment) return false
  if (enrollment.status !== 'active' && enrollment.status !== 'completed') {
    return false
  }
  return !enrollment.expires_at || new Date(enrollment.expires_at) > new Date()
}

export async function hasCourseAccess(
  supabase: DbClient,
  input: { userId: string; courseId: string }
): Promise<boolean> {
  const { data: enrollmentData } = await supabase
    .from('enrollments')
    .select('id, status, expires_at')
    .eq('user_id', input.userId)
    .eq('course_id', input.courseId)
    .in('status', ['active', 'completed'])
    .limit(1)

  const enrollment = ((enrollmentData ?? [])[0] ?? null) as EnrollmentAccessRow | null
  if (enrollmentIsValid(enrollment)) return true

  const [published, subscribed] = await Promise.all([
    isPublishedCourse(supabase, input.courseId),
    hasActiveSubscription(supabase, input.userId),
  ])

  return published && subscribed
}

export async function ensureCourseEnrollmentForAccess(
  supabase: DbClient,
  input: {
    userId: string
    courseId: string
    status?: 'active' | 'completed'
  }
): Promise<{ enrollmentId: string | null; error: string | null }> {
  const status = input.status ?? 'active'

  if (!(await hasCourseAccess(supabase, input))) {
    return { enrollmentId: null, error: 'Sem acesso ao curso' }
  }

  const { data: existingData, error: existingError } = await supabase
    .from('enrollments')
    .select('id, status, expires_at')
    .eq('user_id', input.userId)
    .eq('course_id', input.courseId)
    .limit(1)

  if (existingError) {
    return { enrollmentId: null, error: existingError.message }
  }

  const existing = ((existingData ?? [])[0] ?? null) as EnrollmentAccessRow | null

  if (existing) {
    if (existing.status === 'completed') {
      return { enrollmentId: existing.id, error: null }
    }

    const { error: updateError } = await supabase
      .from('enrollments')
      .update({
        status,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
      } as never)
      .eq('id', existing.id)

    return {
      enrollmentId: updateError ? null : existing.id,
      error: updateError?.message ?? null,
    }
  }

  const now = new Date().toISOString()
  const { data: insertedData, error: insertError } = await supabase
    .from('enrollments')
    .insert({
      user_id: input.userId,
      course_id: input.courseId,
      status,
      enrolled_at: now,
      completed_at: status === 'completed' ? now : null,
      expires_at: null,
    } as never)
    .select('id')
    .single()

  const inserted = insertedData as { id: string } | null

  return {
    enrollmentId: inserted?.id ?? null,
    error: insertError?.message ?? null,
  }
}
