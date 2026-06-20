'use client'

import { useState } from 'react'

interface CopyButtonProps {
  text: string
  label?: string
}

export function CopyButton({ text, label = 'Compartilhar' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback silencioso
    }
  }

  return (
    <button onClick={handleCopy} className="btn btn-ghost btn-sm">
      {copied ? (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '4px' }}>
            <path d="M20 6 9 17l-5-5" />
          </svg>
          Copiado!
        </>
      ) : (
        label
      )}
    </button>
  )
}
