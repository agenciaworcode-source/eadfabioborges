'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UseEnrollmentResult {
  hasAccess: boolean
  isLoading: boolean
  error: Error | null
}

export function useEnrollment(courseId: string): UseEnrollmentResult {
  const [hasAccess, setHasAccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!courseId) {
      setHasAccess(false)
      setIsLoading(false)
      return
    }

    async function checkAccess() {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setHasAccess(false)
          setIsLoading(false)
          return
        }

        const [{ data: enrollments }, { data: subscriptions }] =
          await Promise.all([
            supabase
              .from('enrollments')
              .select('status')
              .eq('user_id', user.id)
              .eq('course_id', courseId)
              .in('status', ['active', 'completed']),
            supabase
              .from('subscriptions')
              .select('status, period_end')
              .eq('user_id', user.id)
              .eq('status', 'active')
              .gt('period_end', new Date().toISOString()),
          ])

        setHasAccess(
          (enrollments?.length ?? 0) > 0 || (subscriptions?.length ?? 0) > 0
        )
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error('Erro ao verificar acesso')
        )
        setHasAccess(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAccess()
  }, [courseId])

  return { hasAccess, isLoading, error }
}
