import type { Metadata } from 'next'
import { PublicNav } from '@/components/layout/PublicNav'
import { PublicFooter } from '@/components/layout/PublicFooter'

export const metadata: Metadata = {
  title: 'Checkout cancelado | Mentoria Fábio Borges',
  description: 'Seu checkout foi cancelado. Volte quando quiser!',
}

export default function CheckoutCanceladoPage() {
  return (
    <>
      <style>{`
        .checkout-page {
          min-height: 60vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 80px 24px;
        }
        .checkout-card {
          background: #fff;
          border: 1px solid var(--line);
          border-radius: var(--r-xl);
          padding: 48px 40px;
          max-width: 520px;
          width: 100%;
          text-align: center;
          box-shadow: var(--shadow);
        }
        .checkout-icon {
          width: 64px;
          height: 64px;
          background: #fef3c7;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
        }
        .checkout-card h1 {
          font-size: 26px;
          margin-bottom: 12px;
          letter-spacing: -.03em;
        }
        .checkout-card p {
          font-size: 15px;
          color: var(--ink-2);
          line-height: 1.6;
          margin-bottom: 32px;
        }
        .btn-row {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
      `}</style>

      <PublicNav />

      <div className="checkout-page">
        <div className="checkout-card">
          <div className="checkout-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <h1>Checkout cancelado</h1>
          <p>
            Não se preocupe — seu cartão não foi cobrado. Volte quando quiser
            para continuar de onde parou.
          </p>
          <div className="btn-row">
            <a href="/cursos" className="btn btn-primary btn-block">
              Ver cursos disponíveis
            </a>
            <a href="/planos" className="btn btn-ghost btn-block">
              Ver planos de mentoria
            </a>
          </div>
        </div>
      </div>

      <PublicFooter />
    </>
  )
}
