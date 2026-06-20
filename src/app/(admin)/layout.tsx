import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { AdminNavLink } from '@/components/admin/AdminNavLink'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profileData } = await supabase
    .from('users')
    .select('role, name')
    .eq('id', user.id)
    .single()

  const profile = profileData as { role: string; name: string } | null

  if (profile?.role !== 'admin') redirect('/dashboard')

  const adminName = profile?.name || 'Administrador'
  const initials = adminName
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="shell">
      <aside className="side admin">
        <div className="brand">
          <Link
            className="logo"
            href="/"
            style={{ filter: 'brightness(0) invert(1)' }}
          >
            <Image
              src="/mb-logo.png"
              alt="MB"
              width={28}
              height={28}
              style={{ height: '28px', width: 'auto' }}
            />
            <span className="lk">
              <b style={{ color: '#fff' }}>Fábio Borges</b>
              <span style={{ color: '#7c828c' }}>Admin</span>
            </span>
          </Link>
        </div>

        <div className="nav-group">Gestão</div>

        <AdminNavLink href="/admin">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <rect x="3" y="3" width="7" height="9" />
            <rect x="14" y="3" width="7" height="5" />
            <rect x="14" y="12" width="7" height="9" />
            <rect x="3" y="16" width="7" height="5" />
          </svg>
          Painel
        </AdminNavLink>

        <AdminNavLink href="/admin/alunos">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <circle cx="9" cy="8" r="4" />
            <path d="M2 21v-1a6 6 0 0 1 6-6h2" />
            <circle cx="17" cy="9" r="3" />
            <path d="M22 21v-1a5 5 0 0 0-4-4.9" />
          </svg>
          Alunos
        </AdminNavLink>

        <AdminNavLink href="/admin/cursos">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          Cursos
        </AdminNavLink>

        <AdminNavLink href="/admin/matriculas">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Matrículas
        </AdminNavLink>

        <AdminNavLink href="/admin/avaliacoes">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M9 11 12 14 22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          Avaliações
        </AdminNavLink>

        <AdminNavLink href="/admin/relatorios">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M3 3v18h18" />
            <path d="m7 14 4-4 3 3 5-6" />
          </svg>
          Relatórios
        </AdminNavLink>

        <AdminNavLink href="/admin/planos">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <path d="M2 10h20M6 15h2M10 15h6" />
          </svg>
          Planos
        </AdminNavLink>

        <div className="nav-group">Plataforma</div>

        <Link className="nav-link" href="/dashboard">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M15 3h6v6M10 14 21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
          </svg>
          Ver plataforma
        </Link>

        <div className="user">
          <div className="avatar" style={{ background: 'var(--blue)' }}>
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{adminName}</div>
            <div style={{ fontSize: '11.5px', color: '#9ca3ae' }}>
              Administrador
            </div>
          </div>
        </div>
      </aside>

      <div className="main">{children}</div>
    </div>
  )
}
