'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface AdminNavLinkProps {
  href: string
  children: React.ReactNode
}

export function AdminNavLink({ href, children }: AdminNavLinkProps) {
  const pathname = usePathname()
  const isActive =
    href === '/admin'
      ? pathname === '/admin'
      : pathname.startsWith(href)
  return (
    <Link href={href} className={`nav-link${isActive ? ' active' : ''}`}>
      {children}
    </Link>
  )
}
