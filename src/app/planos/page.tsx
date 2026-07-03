import type { Metadata } from 'next'
import { PublicNav } from '@/components/layout/PublicNav'
import { PublicFooter } from '@/components/layout/PublicFooter'
import { createClient } from '@/lib/supabase/server'
import { PlanosClient } from './PlanosClient'

// ISR: preços de plano raramente mudam — revalida a cada 5 min
export const revalidate = 300

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ead.fabioborgesoficial.com.br'

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

export default async function PlanosPage() {
  const supabase = createClient()
  const { data: pricesData } = await supabase
    .from('plans')
    .select('id, price_monthly, price_annual')
    .eq('is_active', true)

  const prices = Object.fromEntries(
    ((pricesData ?? []) as PlanPrice[]).map((p) => [p.id, p])
  ) as Record<string, PlanPrice>

  return (
    <>
      <style>{`
        .plans-hero{ padding:56px 0 40px; }
        .plans-hero h1{ font-size:clamp(32px,5vw,52px); margin-bottom:14px; }
        .plans-hero p{ font-size:17px; color:var(--ink-2); max-width:56ch; }
        .plans-section{ padding:0 0 80px; }
      `}</style>

      <PublicNav />

      <header className="plans-hero">
        <div className="wrap">
          <span className="eyebrow">Planos de Mentoria</span>
          <h1 style={{ marginTop: '12px' }}>Escolha o seu nível de evolução</h1>
          <p>
            Acesso a cursos, acompanhamento e mentoria direta com Fábio Borges — do iniciante à
            franquia.
          </p>
        </div>
      </header>

      <section className="plans-section">
        <div className="wrap">
          <PlanosClient prices={prices} />
        </div>
      </section>

      <PublicFooter />
    </>
  )
}
