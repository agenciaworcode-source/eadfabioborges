import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/dashboard/ProfileForm'

export default async function PerfilPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profileData } = await supabase
    .from('users')
    .select('name, avatar_url, specialty, city, plan')
    .eq('id', user.id)
    .single()

  const profile = profileData as {
    name: string
    avatar_url: string | null
    specialty: string | null
    city: string | null
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

  // Plano
  const planKey = profile?.plan ?? 'free'
  const planBadge =
    planKey === 'prata' || planKey === 'monthly'
      ? 'plan-prata'
      : planKey === 'diamante' || planKey === 'lifetime'
      ? 'plan-diamante'
      : planKey === 'free'
      ? 'plan-free'
      : 'plan-ouro'
  const planLabel =
    planKey === 'prata' || planKey === 'monthly'
      ? 'Prata'
      : planKey === 'diamante' || planKey === 'lifetime'
      ? 'Diamante'
      : planKey === 'free'
      ? 'Gratuito'
      : 'Ouro'

  // Membro desde
  const memberSince = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' })
    .format(new Date(user.created_at))
    .replace('. ', ' ')

  // Stats
  const { count: cursosCount } = await supabase
    .from('enrollments')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'completed')

  const { count: certCount } = await supabase
    .from('certificates')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  return (
    <>
      <style>{`
        .pf-grid{ display:grid; grid-template-columns:1fr 320px; gap:28px; align-items:start; }
        .upload{ display:flex; align-items:center; gap:20px; }
        .upload .ph{ position:relative; }
        .upload .cam{ position:absolute; right:-2px; bottom:-2px; width:30px; height:30px; border-radius:50%; background:var(--blue); color:#fff; display:grid; place-items:center; border:3px solid #fff; }
        @media (max-width:900px){ .pf-grid{ grid-template-columns:1fr; } }
      `}</style>

      <div className="content wide">
        <h1 style={{ fontSize: '28px' }}>Perfil</h1>
        <p className="muted" style={{ marginTop: '6px' }}>
          Gerencie suas informações pessoais e segurança.
        </p>

        <div className="pf-grid" style={{ marginTop: '24px' }}>
          {/* COLUNA ESQUERDA */}
          <div className="col gap24">
            <ProfileForm
              userId={user.id}
              email={user.email ?? ''}
              initials={initials}
              initialData={{
                name: displayName,
                avatar_url: profile?.avatar_url ?? null,
                specialty: profile?.specialty ?? null,
                city: profile?.city ?? null,
              }}
            />
          </div>

          {/* COLUNA DIREITA */}
          <aside className="col gap24">
            <div className="card card-pad center">
              <div className="avatar lg" style={{ margin: '0 auto' }}>
                {initials}
              </div>
              <h3 style={{ fontSize: '18px', marginTop: '14px' }}>{displayName}</h3>
              <p className="muted" style={{ fontSize: '13.5px' }}>Membro desde {memberSince}</p>
              <span className={`plan-badge ${planBadge}`} style={{ marginTop: '12px' }}>
                Plano {planLabel}
              </span>
            </div>

            <div className="card card-pad">
              <div className="flex between">
                <span className="muted" style={{ fontSize: '13.5px' }}>Cursos concluídos</span>
                <b>{cursosCount ?? 0}</b>
              </div>
              <hr className="soft-divider" style={{ margin: '12px 0' }} />
              <div className="flex between">
                <span className="muted" style={{ fontSize: '13.5px' }}>Certificados</span>
                <b>{certCount ?? 0}</b>
              </div>
              <hr className="soft-divider" style={{ margin: '12px 0' }} />
              <div className="flex between">
                <span className="muted" style={{ fontSize: '13.5px' }}>Plano atual</span>
                <b>{planLabel}</b>
              </div>
            </div>

            <div className="card card-pad">
              <Link href="/dashboard/plano" className="btn btn-ghost btn-block">
                Ver meu plano
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}
