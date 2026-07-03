'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { addCourseToCart, setPlanCart } from '@/lib/cart/client'

function CheckoutIniciarContent() {
  const searchParams = useSearchParams()
  const courseId = searchParams.get('courseId')
  const courseSlug = searchParams.get('courseSlug') ?? undefined
  const planId = searchParams.get('planId')
  const billingPeriod = (searchParams.get('billingPeriod') ?? 'monthly') as 'monthly' | 'annual'

  useEffect(() => {
    if (courseId) {
      addCourseToCart({ courseId, courseSlug })
    } else if (planId) {
      setPlanCart({ planId, billingPeriod })
    }

    window.location.href = '/checkout/carrinho'
  }, [billingPeriod, courseId, courseSlug, planId])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--blue)"
          strokeWidth="2"
          style={{ animation: 'spin 1s linear infinite', marginBottom: '20px' }}
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        <p style={{ color: 'var(--muted)', fontSize: '16px' }}>Abrindo carrinho...</p>
      </div>
    </div>
  )
}

export default function CheckoutIniciarPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <p style={{ color: 'var(--muted)' }}>Carregando...</p>
        </div>
      }
    >
      <CheckoutIniciarContent />
    </Suspense>
  )
}
