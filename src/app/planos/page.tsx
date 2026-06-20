import type { Metadata } from 'next'
import { PublicNav } from '@/components/layout/PublicNav'
import { PublicFooter } from '@/components/layout/PublicFooter'
import { CheckoutButton } from '@/components/checkout/CheckoutButton'
import { createClient } from '@/lib/supabase/server'
import { PLANS, formatPlanPrice } from '@/config/plans'

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? 'https://ead.fabioborgesoficial.com.br'

export const metadata: Metadata = {
  title: 'Planos de Mentoria | Fábio Borges',
  description:
    'Conheça os planos de mentoria profissional em estética: Prata, Ouro, Diamante e Macroempresa. Acesso a cursos, videoconferências e acompanhamento especializado.',
  openGraph: {
    title: 'Planos de Mentoria | Fábio Borges',
    description:
      'Conheça os planos de mentoria profissional em estética: Prata, Ouro, Diamante e Macroempresa. Acesso a cursos, videoconferências e acompanhamento especializado.',
    url: `${APP_URL}/planos`,
    type: 'website',
    images: [{ url: `${APP_URL}/og-default.png`, width: 1200, height: 630 }],
  },
}

interface PlanPrice {
  id: string
  price_monthly: number
  price_annual: number
}

const checkSvg = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

export default async function PlanosPage() {
  const supabase = createClient()
  const { data: pricesData } = await supabase
    .from('plans')
    .select('id, price_monthly, price_annual')
    .eq('is_active', true)

  const prices = Object.fromEntries(
    ((pricesData ?? []) as PlanPrice[]).map((p) => [p.id, p])
  ) as Record<string, PlanPrice>

  // Apenas planos exibíveis (excluir 'free')
  const visiblePlans = PLANS.filter((p) => p.id !== 'free')

  return (
    <>
      <style>{`
        .plans-hero{ padding:56px 0 40px; }
        .plans-hero h1{ font-size:clamp(32px,5vw,52px); margin-bottom:14px; }
        .plans-hero p{ font-size:17px; color:var(--ink-2); max-width:56ch; }
        .plans-section{ padding:0 0 80px; }
        .plans-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:20px; margin-top:40px; align-items:start; }
        .pcard{ background:#fff; border:1px solid var(--line); border-radius:var(--r-xl); padding:28px 24px; position:relative; }
        .pcard.feat{ border:2px solid var(--indigo); box-shadow:var(--shadow-blue); }
        .pcard .ribbon{ position:absolute; top:-14px; left:50%; transform:translateX(-50%); background:var(--indigo); color:#fff; font-size:11px; font-weight:600; padding:5px 14px; border-radius:980px; white-space:nowrap; }
        .pcard .plan-name{ font-size:22px; font-weight:700; margin:10px 0 4px; letter-spacing:-.03em; }
        .pcard .plan-public{ font-size:13px; color:var(--muted); margin-bottom:16px; }
        .pcard .plan-desc{ font-size:13.5px; color:var(--ink-2); line-height:1.55; margin-bottom:20px; padding-bottom:20px; border-bottom:1px solid var(--line); }
        .pcard .plan-price{ font-size:28px; font-weight:700; letter-spacing:-.04em; margin:0 0 4px; }
        .pcard .plan-price-sub{ font-size:12px; color:var(--muted); margin-bottom:20px; }
        .pcard ul{ list-style:none; padding:0; margin:0 0 24px; display:flex; flex-direction:column; gap:10px; }
        .pcard li{ font-size:13.5px; color:var(--ink-2); display:flex; gap:9px; align-items:flex-start; }
        .pcard li svg{ color:var(--blue-600); flex:none; margin-top:2px; }
        .pcard .recur{ font-size:12px; color:var(--muted); text-align:center; margin-top:12px; }
        @media(max-width:1100px){ .plans-grid{ grid-template-columns:repeat(2,1fr); } }
        @media(max-width:600px){ .plans-grid{ grid-template-columns:1fr; } }
      `}</style>

      <PublicNav />

      <header className="plans-hero">
        <div className="wrap">
          <span className="eyebrow">Planos de Mentoria</span>
          <h1 style={{ marginTop: '12px' }}>Escolha o seu nível de evolução</h1>
          <p>Acesso a cursos, acompanhamento e mentoria direta com Fábio Borges — do iniciante à franquia.</p>
        </div>
      </header>

      <section className="plans-section">
        <div className="wrap">
          <div className="plans-grid">
            {visiblePlans.map((plano) => {
              const planPrice = prices[plano.id]
              const monthlyLabel = plano.isCustomPricing
                ? 'Sob consulta'
                : planPrice
                ? formatPlanPrice(planPrice.price_monthly)
                : '—'

              return (
                <div key={plano.id} className={`pcard${plano.isFeatured ? ' feat' : ''}`}>
                  {plano.isFeatured && <span className="ribbon">Mais popular</span>}
                  <span className={`plan-badge ${plano.badge}`}>{plano.name}</span>
                  <div className="plan-name">{plano.name}</div>
                  <div className="plan-public">{plano.audience}</div>
                  <p className="plan-desc">{plano.description}</p>

                  {!plano.isCustomPricing && (
                    <>
                      <div className="plan-price">{monthlyLabel}</div>
                      <div className="plan-price-sub">por mês · ou anual com desconto</div>
                    </>
                  )}
                  {plano.isCustomPricing && (
                    <div className="plan-price" style={{ fontSize: '18px' }}>Sob consulta</div>
                  )}

                  <ul>
                    {plano.features.map((d) => (
                      <li key={d}>{checkSvg}{d}</li>
                    ))}
                  </ul>
                  {plano.isCustomPricing ? (
                    <a
                      href="https://wa.me/5511999999999?text=Olá%2C%20tenho%20interesse%20no%20plano%20Macroempresa%20da%20Mentoria%20Fábio%20Borges"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost btn-block"
                    >
                      Fale Conosco
                    </a>
                  ) : (
                    <CheckoutButton
                      planId={plano.id}
                      billingPeriod="monthly"
                      label="Assinar plano"
                      className={plano.isFeatured ? 'btn btn-primary btn-block' : 'btn btn-ghost btn-block'}
                    />
                  )}
                  <p className="recur">
                    {plano.billingOptions.includes('annual') && plano.billingOptions.includes('monthly')
                      ? 'Mensal / Anual'
                      : 'Anual'}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <PublicFooter />
    </>
  )
}
