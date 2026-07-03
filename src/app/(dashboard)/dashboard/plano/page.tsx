import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type PlanKey = 'free' | 'prata' | 'monthly' | 'ouro' | 'annual' | 'diamante' | 'lifetime'

interface PlanDetail {
  name: string
  badge: string
  price: string
  priceLabel: string
  benefits: string[]
  upsellTo: string | null
  upsellName: string | null
  upsellPrice: string | null
  upsellDesc: string | null
}

const PLAN_DETAILS: Record<PlanKey, PlanDetail> = {
  free: {
    name: 'Gratuito',
    badge: 'plan-free',
    price: 'Grátis',
    priceLabel: '',
    benefits: ['Acesso a 2 cursos introdutórios', 'Comunidade aberta'],
    upsellTo: '/planos',
    upsellName: 'Suba para Prata',
    upsellPrice: 'R$ 97/mês',
    upsellDesc: '4 cursos essenciais + materiais + certificado.',
  },
  prata: {
    name: 'Prata',
    badge: 'plan-prata',
    price: 'R$ 97',
    priceLabel: '/mês',
    benefits: ['4 cursos essenciais', 'Materiais para download', 'Certificado digital'],
    upsellTo: '/planos',
    upsellName: 'Suba para Ouro',
    upsellPrice: 'R$ 197/mês',
    upsellDesc: 'Todos os 6 cursos + quizzes + certificados ilimitados.',
  },
  monthly: {
    name: 'Prata',
    badge: 'plan-prata',
    price: 'R$ 97',
    priceLabel: '/mês',
    benefits: ['4 cursos essenciais', 'Materiais para download', 'Certificado digital'],
    upsellTo: '/planos',
    upsellName: 'Suba para Ouro',
    upsellPrice: 'R$ 197/mês',
    upsellDesc: 'Todos os 6 cursos + quizzes + certificados ilimitados.',
  },
  ouro: {
    name: 'Ouro',
    badge: 'plan-ouro',
    price: 'R$ 197',
    priceLabel: '/mês',
    benefits: [
      'Todos os 6 cursos',
      'Quizzes e avaliações',
      'Certificados ilimitados',
      'Materiais para download',
      'Suporte prioritário',
    ],
    upsellTo: '/planos',
    upsellName: 'Suba para Diamante',
    upsellPrice: 'R$ 397/mês',
    upsellDesc: 'Mentoria ao vivo mensal + certificado prioritário.',
  },
  annual: {
    name: 'Ouro',
    badge: 'plan-ouro',
    price: 'R$ 197',
    priceLabel: '/mês',
    benefits: [
      'Todos os 6 cursos',
      'Quizzes e avaliações',
      'Certificados ilimitados',
      'Materiais para download',
      'Suporte prioritário',
    ],
    upsellTo: '/planos',
    upsellName: 'Suba para Diamante',
    upsellPrice: 'R$ 397/mês',
    upsellDesc: 'Mentoria ao vivo mensal + certificado prioritário.',
  },
  diamante: {
    name: 'Diamante',
    badge: 'plan-diamante',
    price: 'R$ 397',
    priceLabel: '/mês',
    benefits: ['Tudo do Ouro', 'Mentoria ao vivo mensal', 'Certificado prioritário', 'Suporte VIP'],
    upsellTo: null,
    upsellName: null,
    upsellPrice: null,
    upsellDesc: null,
  },
  lifetime: {
    name: 'Diamante',
    badge: 'plan-diamante',
    price: 'Vitalício',
    priceLabel: '',
    benefits: [
      'Acesso total e vitalício',
      'Mentoria ao vivo mensal',
      'Certificado prioritário',
      'Suporte VIP',
    ],
    upsellTo: null,
    upsellName: null,
    upsellPrice: null,
    upsellDesc: null,
  },
}

const checkSvg = (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

function formatDate(isoDate: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(isoDate))
}

export default async function PlanoPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profileData } = await supabase
    .from('users')
    .select('plan')
    .eq('id', user.id)
    .single()

  const profile = profileData as { plan: string } | null

  const { data: subscriptionData } = await supabase
    .from('subscriptions')
    .select('plan, status, period_end')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const subscription = subscriptionData as {
    plan: string
    status: string
    period_end: string
  } | null

  const planKey = (profile?.plan ?? 'free') as PlanKey
  const plan = PLAN_DETAILS[planKey] ?? PLAN_DETAILS.free

  return (
    <>
      <style>{`
        .plan-hero{ background:linear-gradient(120deg,var(--ink),#23262e); color:#fff; border-radius:var(--r-lg); padding:30px; display:grid; grid-template-columns:1fr auto; gap:24px; align-items:center; position:relative; overflow:hidden; }
        .plan-hero .glow{ position:absolute; width:280px; height:280px; right:-40px; top:-100px; border-radius:50%; background:radial-gradient(circle,rgba(72,161,254,.45),transparent 70%); }
        .plan-hero .z{ position:relative; }
        .pg{ display:grid; grid-template-columns:1fr 320px; gap:24px; align-items:start; margin-top:24px; }
        .benefit-li{ display:flex; gap:10px; align-items:center; font-size:14.5px; color:var(--ink-2); padding:9px 0; }
        .benefit-li svg{ color:var(--blue-600); flex:none; }
        @media (max-width:900px){ .pg{ grid-template-columns:1fr; } .plan-hero{ grid-template-columns:1fr; } }
      `}</style>

      <div className="content wide">
        <h1 style={{ fontSize: '28px' }}>Meu plano</h1>

        {/* HERO DO PLANO */}
        <div className="plan-hero" style={{ marginTop: '20px' }}>
          <div className="glow" />
          <div className="z">
            <span
              className={`plan-badge ${plan.badge}`}
              style={{ background: 'rgba(72,161,254,.2)', color: '#9ecbff' }}
            >
              Plano {plan.name} · {planKey === 'free' ? 'Gratuito' : 'Ativo'}
            </span>
            {planKey !== 'free' && (
              <div
                style={{
                  fontSize: '30px',
                  fontWeight: 600,
                  letterSpacing: '-.03em',
                  margin: '12px 0 4px',
                }}
              >
                {plan.price}
                <span style={{ fontSize: '15px', color: 'rgba(255,255,255,.6)', fontWeight: 500 }}>
                  {plan.priceLabel}
                </span>
              </div>
            )}
            {planKey === 'free' && (
              <div
                style={{
                  fontSize: '30px',
                  fontWeight: 600,
                  letterSpacing: '-.03em',
                  margin: '12px 0 4px',
                }}
              >
                Grátis
              </div>
            )}
            {subscription?.period_end ? (
              <p style={{ color: 'rgba(255,255,255,.65)', fontSize: '14px' }}>
                Renova em <b style={{ color: '#fff' }}>{formatDate(subscription.period_end)}</b>
              </p>
            ) : (
              <p style={{ color: 'rgba(255,255,255,.65)', fontSize: '14px' }}>
                {planKey === 'free'
                  ? 'Sem data de vencimento'
                  : 'Gerencie sua assinatura no painel de pagamentos'}
              </p>
            )}
          </div>
          <div className="z flex gap12">
            <Link className="btn btn-primary" href="/planos">
              Fazer upgrade
            </Link>
            <button
              className="btn btn-ghost"
              style={{ color: '#fff', borderColor: 'rgba(255,255,255,.3)' }}
            >
              Gerenciar
            </button>
          </div>
        </div>

        <div className="pg">
          {/* HISTÓRICO DE PAGAMENTOS */}
          <div className="col gap24">
            <div className="card card-pad">
              <h3 style={{ fontSize: '18px' }}>Histórico de pagamentos</h3>
              <div className="tbl-wrap" style={{ marginTop: '14px' }}>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Descrição</th>
                      <th>Valor</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {planKey === 'free' ? (
                      <tr>
                        <td
                          colSpan={5}
                          style={{
                            textAlign: 'center',
                            color: 'var(--muted)',
                            padding: '28px 16px',
                          }}
                        >
                          Nenhuma transação registrada
                        </td>
                      </tr>
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          style={{
                            textAlign: 'center',
                            color: 'var(--muted)',
                            padding: '28px 16px',
                          }}
                        >
                          Histórico disponível após integração com Stripe
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* SIDEBAR DE BENEFÍCIOS */}
          <aside className="card card-pad">
            <h3 style={{ fontSize: '16px' }}>Incluído no seu plano</h3>
            <div style={{ marginTop: '8px' }}>
              {plan.benefits.map((benefit) => (
                <div key={benefit} className="benefit-li">
                  {checkSvg}
                  {benefit}
                </div>
              ))}
            </div>

            {plan.upsellTo && (
              <>
                <hr className="soft-divider" style={{ margin: '16px 0' }} />
                <div
                  style={{
                    background: 'var(--blue-tint)',
                    borderRadius: 'var(--r)',
                    padding: '16px',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--blue-700)' }}>
                    {plan.upsellName}
                  </div>
                  <p className="muted" style={{ fontSize: '13px', margin: '5px 0 12px' }}>
                    {plan.upsellDesc} por {plan.upsellPrice}.
                  </p>
                  <Link className="btn btn-primary btn-sm btn-block" href={plan.upsellTo}>
                    Ver detalhes
                  </Link>
                </div>
              </>
            )}
          </aside>
        </div>
      </div>
    </>
  )
}
