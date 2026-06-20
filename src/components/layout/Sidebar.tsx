'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface SidebarProps {
  name?: string
  initials?: string
  planBadge?: string
  planLabel?: string
}

const navLinks = [
  {
    href: '/dashboard',
    label: 'Visão geral',
    exact: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <path d="M9 22V12h6v10" />
      </svg>
    ),
  },
  {
    href: '/dashboard/cursos',
    label: 'Meus cursos',
    exact: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    href: '/dashboard/certificados',
    label: 'Certificados',
    exact: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="6" />
        <path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5" />
      </svg>
    ),
  },
]

const accountLinks = [
  {
    href: '/dashboard/plano',
    label: 'Meu plano',
    exact: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    ),
  },
  {
    href: '/dashboard/perfil',
    label: 'Perfil',
    exact: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
      </svg>
    ),
  },
  {
    href: '/cursos',
    label: 'Explorar cursos',
    exact: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    ),
  },
]

function isActive(pathname: string, href: string, exact: boolean): boolean {
  if (exact) return pathname === href
  return pathname.startsWith(href)
}

export function Sidebar({ name = 'Aluno', initials, planBadge = 'plan-ouro', planLabel = 'Ouro' }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const displayInitials =
    initials ||
    name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase() ||
    'AL'

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <aside className="side">
      <div className="brand">
        <Link className="logo" href="/">
          <Image src="/mb-logo.png" alt="MB" width={30} height={30} style={{ height: '30px', width: 'auto' }} />
          <span className="lk">
            <b>Fábio Borges</b>
            <span>Mentoria</span>
          </span>
        </Link>
      </div>

      <div className="nav-group">Menu</div>
      {navLinks.map((link) => (
        <Link
          key={link.href}
          className={`nav-link${isActive(pathname, link.href, link.exact) ? ' active' : ''}`}
          href={link.href}
        >
          {link.icon}
          {link.label}
        </Link>
      ))}

      <div className="nav-group">Conta</div>
      {accountLinks.map((link) => (
        <Link
          key={link.href}
          className={`nav-link${isActive(pathname, link.href, link.exact) ? ' active' : ''}`}
          href={link.href}
        >
          {link.icon}
          {link.label}
        </Link>
      ))}

      <button
        onClick={handleSignOut}
        className="nav-link"
        style={{ background: 'none', border: 'none', textAlign: 'left', width: '100%' }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Sair
      </button>

      <div className="user">
        <div className="avatar">{displayInitials}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{name}</div>
          <div className={`plan-badge ${planBadge}`} style={{ marginTop: '3px', padding: '2px 8px', fontSize: '10.5px' }}>
            {planLabel}
          </div>
        </div>
      </div>
    </aside>
  )
}
