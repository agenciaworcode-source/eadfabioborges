'use client'

import Link from 'next/link'
import { useState } from 'react'
import { addCourseToCart, setPlanCart } from '@/lib/cart/client'

interface CheckoutButtonProps {
  label: string
  courseId?: string
  courseSlug?: string
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
  const [added, setAdded] = useState(false)

  function handleClick() {
    if (courseId) {
      addCourseToCart({ courseId, courseSlug })
      setAdded(true)
      return
    }

    if (planId) {
      setPlanCart({ planId, billingPeriod })
      window.location.href = '/checkout/carrinho'
    }
  }

  if (added) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: '10px',
            padding: '12px 16px',
            color: '#166534',
            fontWeight: '600',
            fontSize: '14px',
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
          Adicionado ao carrinho!
        </div>
        <Link href="/checkout/carrinho" className="btn btn-primary btn-block">
          Ir para o carrinho
        </Link>
        <button
          onClick={() => setAdded(false)}
          className="btn btn-ghost btn-block"
          style={{ fontSize: '13px' }}
        >
          Continuar comprando
        </button>
      </div>
    )
  }

  return (
    <button onClick={handleClick} className={className ?? 'btn btn-primary btn-block'}>
      {label}
    </button>
  )
}
