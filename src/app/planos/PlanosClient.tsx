'use client'

import { useState } from 'react'
import { CheckoutButton } from '@/components/checkout/CheckoutButton'
import { PLANS, formatPlanPrice } from '@/config/plans'

interface PlanPrice {
  id: string
  price_monthly: number
  price_annual: number
}

const checkSvg = (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

export function PlanosClient({ prices }: { prices: Record<string, PlanPrice> }) {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const visiblePlans = PLANS.filter((p) => p.id !== 'free')

  return (
    <>
      <style>{`
        .billing-toggle{ display:flex; align-items:center; justify-content:center; gap:0; background:#f3f4f6; border-radius:980px; padding:4px; width:fit-content; margin:0 auto 36px; }
        .billing-btn{ padding:8px 22px; border-radius:980px; border:none; font-size:14px; font-weight:600; cursor:pointer; transition:all .18s; background:transparent; color:var(--ink-2); }
        .billing-btn.active{ background:#fff; color:var(--ink); box-shadow:0 1px 4px rgba(0,0,0,.12); }
        .annual-badge{ display:inline-flex; align-items:center; background:#dcfce7; color:#16a34a; font-size:11px; font-weight:700; padding:2px 8px; border-radius:980px; margin-left:6px; }
        .plans-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:20px; align-items:start; }
        .pcard{ background:#fff; border:1px solid var(--line); border-radius:var(--r-xl); padding:28px 24px; position:relative; }
        .pcard.feat{ border:2px solid var(--indigo); box-shadow:var(--shadow-blue); }
        .pcard .ribbon{ position:absolute; top:-14px; left:50%; transform:translateX(-50%); background:var(--indigo); color:#fff; font-size:11px; font-weight:600; padding:5px 14px; border-radius:980px; white-space:nowrap; }
        .pcard .plan-name{ font-size:22px; font-weight:700; margin:10px 0 4px; letter-spacing:-.03em; }
        .pcard .plan-public{ font-size:13px; color:var(--muted); margin-bottom:16px; line-height:1.4; }
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

      {/* Toggle 12x / À vista */}
      <div className="billing-toggle">
        <button
          className={`billing-btn${billing === 'monthly' ? ' active' : ''}`}
          onClick={() => setBilling('monthly')}
        >
          12x no cartão
        </button>
        <button
          className={`billing-btn${billing === 'annual' ? ' active' : ''}`}
          onClick={() => setBilling('annual')}
        >
          À vista
          <span className="annual-badge">-17%</span>
        </button>
      </div>

      <div className="plans-grid">
        {visiblePlans.map((plano) => {
          const planPrice = prices[plano.id]

          // Preço exibido conforme seleção
          const displayCents =
            billing === 'annual' ? planPrice?.price_annual : planPrice?.price_monthly

          const priceLabel = displayCents ? formatPlanPrice(displayCents) : '—'

          // Sub-label contextual
          let priceSubLabel: string
          if (billing === 'monthly') {
            const totalAnualCents = planPrice ? planPrice.price_monthly * 12 : 0
            priceSubLabel = `12x · total ${formatPlanPrice(totalAnualCents)} por ano`
          } else {
            priceSubLabel = 'à vista no boleto · 17% de desconto'
          }

          const priceSuffix = billing === 'monthly' ? '/mês' : ' à vista'

          return (
            <div key={plano.id} className={`pcard${plano.isFeatured ? ' feat' : ''}`}>
              {plano.isFeatured && <span className="ribbon">Mais popular</span>}
              <span className={`plan-badge ${plano.badge}`}>{plano.name}</span>
              <div className="plan-name">{plano.name}</div>
              <div className="plan-public">{plano.audience}</div>
              <p className="plan-desc">{plano.description}</p>

              {planPrice && (
                <>
                  <div className="plan-price">
                    {priceLabel}
                    <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--muted)' }}>
                      {priceSuffix}
                    </span>
                  </div>
                  <div className="plan-price-sub">{priceSubLabel}</div>
                </>
              )}

              <ul>
                {plano.features.map((d) => (
                  <li key={d}>
                    {checkSvg}
                    {d}
                  </li>
                ))}
              </ul>

              {plano.id === 'macroempresa' ? (
                <a
                  href="https://wa.me/5521997022329?text=Olá%2C%20tenho%20interesse%20no%20Plano%20Macroempresa%20da%20Mentoria%20Fábio%20Borges."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost btn-block"
                >
                  Falar com o mentor
                </a>
              ) : (
                <CheckoutButton
                  planId={plano.id}
                  billingPeriod={billing}
                  label={
                    billing === 'annual'
                      ? `Assinar ${plano.name} à vista`
                      : `Assinar ${plano.name} em 12x`
                  }
                  className={
                    plano.isFeatured ? 'btn btn-primary btn-block' : 'btn btn-ghost btn-block'
                  }
                />
              )}

              <p className="recur">
                {plano.id === 'macroempresa'
                  ? 'Atendimento: (21) 99702-2329'
                  : billing === 'annual'
                    ? 'Cobrança única · 1 ano de acesso'
                    : '12 parcelas · 1 ano de acesso'}
              </p>
            </div>
          )
        })}
      </div>
    </>
  )
}
