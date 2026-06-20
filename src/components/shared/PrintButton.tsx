'use client'

interface PrintButtonProps {
  label?: string
}

export function PrintButton({ label = 'Imprimir' }: PrintButtonProps) {
  return (
    <button className="btn btn-ghost btn-sm" onClick={() => window.print()}>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        style={{ marginRight: '6px' }}
      >
        <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <path d="M6 14h12v8H6z" />
      </svg>
      {label}
    </button>
  )
}
