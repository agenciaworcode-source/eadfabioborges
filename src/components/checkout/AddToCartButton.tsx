'use client'

import { useState } from 'react'
import { addCourseToCart } from '@/lib/cart/client'

interface AddToCartButtonProps {
  courseId: string
  courseSlug: string
  className?: string
}

export function AddToCartButton({ courseId, courseSlug, className }: AddToCartButtonProps) {
  const [added, setAdded] = useState(false)

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    addCourseToCart({ courseId, courseSlug })
    setAdded(true)
    setTimeout(() => setAdded(false), 2500)
  }

  return (
    <button
      onClick={handleClick}
      className={className ?? 'btn btn-primary btn-block btn-sm'}
      style={
        added
          ? {
              background: '#f0fdf4',
              border: '1px solid #86efac',
              color: '#166534',
              fontWeight: '600',
            }
          : undefined
      }
    >
      {added ? (
        <span
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
          Adicionado!
        </span>
      ) : (
        'Adicionar ao carrinho'
      )}
    </button>
  )
}
