import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopbarCrumb } from '@/components/layout/TopbarCrumb'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profileData } = await supabase
    .from('users')
    .select('name, avatar_url, plan')
    .eq('id', user.id)
    .single()

  const profile = profileData as { name: string; avatar_url: string | null; plan: string | null } | null

  const displayName =
    profile?.name ||
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split('@')[0] ||
    'Aluno'

  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()

  const planKey = (profile?.plan ?? 'free') as string
  const planBadge =
    planKey === 'free'
      ? 'plan-free'
      : planKey === 'prata' || planKey === 'monthly'
      ? 'plan-prata'
      : planKey === 'diamante' || planKey === 'lifetime'
      ? 'plan-diamante'
      : 'plan-ouro'
  const planLabel =
    planKey === 'free'
      ? 'Gratuito'
      : planKey === 'prata' || planKey === 'monthly'
      ? 'Prata'
      : planKey === 'diamante' || planKey === 'lifetime'
      ? 'Diamante'
      : 'Ouro'

  return (
    <div className="shell">
      <Sidebar name={displayName} initials={initials} planBadge={planBadge} planLabel={planLabel} />

      <div className="main">
        <div className="topbar">
          <TopbarCrumb />
          <div className="flex aic gap16">
            <button
              className="btn-icn"
              style={{ background: '#fff', border: '1px solid var(--line)' }}
              aria-label="Notificações"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.7 21a2 2 0 0 1-3.4 0" />
              </svg>
            </button>
            <div className="avatar sm">{initials}</div>
          </div>
        </div>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
