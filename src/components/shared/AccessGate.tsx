'use client'

import Link from 'next/link'
import { Lock } from 'lucide-react'
import { useEnrollment } from '@/hooks/use-enrollment'

interface AccessGateProps {
  courseId: string
  children: React.ReactNode
  courseName?: string
  planRequired?: 'prata' | 'ouro' | 'diamante'
}

export function AccessGate({
  courseId,
  children,
  courseName,
  planRequired = 'prata',
}: AccessGateProps) {
  const { hasAccess, isLoading } = useEnrollment(courseId)

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-12 rounded-lg bg-zinc-800" />
        <div className="h-12 rounded-lg bg-zinc-800" />
        <div className="h-12 rounded-lg bg-zinc-800" />
      </div>
    )
  }

  if (hasAccess) {
    return <>{children}</>
  }

  return (
    <div className="relative">
      <div className="pointer-events-none select-none opacity-30">{children}</div>

      <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-zinc-900/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4 px-6 py-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800">
            <Lock className="h-6 w-6 text-amber-400" />
          </div>

          <div className="space-y-1">
            <p className="font-semibold text-white">Conteúdo bloqueado</p>
            <p className="text-sm text-zinc-400">
              {courseName
                ? `"${courseName}" está disponível`
                : 'Conteúdo disponível'}{' '}
              no plano{' '}
              <span className="capitalize text-amber-400">{planRequired}</span>{' '}
              ou superior
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/planos"
              className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-amber-400"
            >
              Ver planos
            </Link>
            <Link
              href={`/cursos/${courseId}`}
              className="inline-flex items-center justify-center rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-400 hover:text-white"
            >
              Comprar avulso
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
