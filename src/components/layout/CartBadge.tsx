'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { readCart } from '@/lib/cart/client'

export function CartBadge() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const update = () => setCount(readCart().length)
    update()
    window.addEventListener('cart:updated', update)
    return () => window.removeEventListener('cart:updated', update)
  }, [])

  return (
    <Link
      href="/checkout/carrinho"
      aria-label={count > 0 ? `Carrinho (${count} ${count === 1 ? 'item' : 'itens'})` : 'Carrinho'}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        color: 'var(--ink-2)',
        padding: '4px',
        flexShrink: 0,
      }}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      {count > 0 && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '-4px',
            right: '-6px',
            background: 'var(--blue, #2563eb)',
            color: '#fff',
            fontSize: '11px',
            fontWeight: '700',
            minWidth: '18px',
            height: '18px',
            borderRadius: '9px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            lineHeight: 1,
          }}
        >
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  )
}
