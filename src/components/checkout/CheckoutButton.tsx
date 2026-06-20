'use client'

import { useState } from 'react'

interface CheckoutButtonProps {
  label: string
  courseId?: string      // UUID do curso — usado na API de checkout
  courseSlug?: string    // slug do curso — usado no redirect de login
  planId?: string
  billingPeriod?: 'monthly' | 'annual'
  className?: string
}

export function CheckoutButton({
  label,
  courseId,
  courseSlug,
  planId,
  billingPeriod = 'monthly',
  className,
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      let res: Response
      if (courseId) {
        res = await fetch('/api/checkout/curso', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId }),
        })
      } else if (planId) {
        res = await fetch('/api/checkout/plano', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId, billingPeriod }),
        })
      } else {
        window.location.href = '/auth/login'
        return
      }

      if (res.status === 401) {
        // Não autenticado — redireciona para login com return URL
        const returnPath = courseSlug
          ? `/cursos/${courseSlug}`
          : planId
          ? '/planos'
          : '/'
        window.location.href = `/auth/login?returnUrl=${encodeURIComponent(returnPath)}`
        return
      }

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        console.error('[checkout] error:', data.error)
        setLoading(false)
        return
      }

      const data = (await res.json()) as { url?: string }
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('[checkout] unexpected error:', err)
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={className ?? 'btn btn-primary btn-block'}
      style={loading ? { opacity: 0.7, cursor: 'wait' } : undefined}
    >
      {loading ? 'Aguarde...' : label}
    </button>
  )
}
