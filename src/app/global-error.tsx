'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
          <h2 className="text-xl font-semibold text-gray-800">Erro crítico</h2>
          <p className="text-sm text-gray-500">
            {error.message || 'Ocorreu um erro inesperado na aplicação.'}
          </p>
          <button
            onClick={reset}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
          >
            Recarregar
          </button>
        </div>
      </body>
    </html>
  )
}
