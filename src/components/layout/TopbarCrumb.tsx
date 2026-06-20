'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

interface CrumbEntry {
  label: string
  parent?: { href: string; label: string }
}

const crumbMap: Record<string, CrumbEntry> = {
  '/dashboard': { label: 'Visão geral' },
  '/dashboard/perfil': { label: 'Perfil', parent: { href: '/dashboard', label: 'Início' } },
  '/dashboard/plano': { label: 'Meu plano', parent: { href: '/dashboard', label: 'Início' } },
  '/dashboard/cursos': { label: 'Meus cursos', parent: { href: '/dashboard', label: 'Início' } },
  '/dashboard/certificados': {
    label: 'Certificados',
    parent: { href: '/dashboard', label: 'Início' },
  },
}

export function TopbarCrumb() {
  const pathname = usePathname()

  let crumb: CrumbEntry = crumbMap[pathname] ?? { label: 'Visão geral' }

  // Rota dinâmica de curso
  if (pathname.startsWith('/dashboard/curso/')) {
    crumb = { label: 'Curso', parent: { href: '/dashboard', label: 'Início' } }
  }

  return (
    <div className="crumb">
      {crumb.parent && (
        <>
          <Link href={crumb.parent.href}>{crumb.parent.label}</Link>
          <span>›</span>
        </>
      )}
      <b>{crumb.label}</b>
    </div>
  )
}
