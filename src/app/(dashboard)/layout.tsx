import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopbarCrumb } from '@/components/layout/TopbarCrumb'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?returnUrl=/dashboard')
  }

  const { data: profileData } = await supabase
    .from('users')
    .select('name, avatar_url, plan')
    .eq('id', user.id)
    .single()

  const profile = profileData as {
    name: string
    avatar_url: string | null
    plan: string | null
  } | null

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
            <div className="avatar sm">{initials}</div>
          </div>
        </div>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
