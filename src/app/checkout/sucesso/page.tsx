import type { Metadata } from 'next'
import { PublicNav } from '@/components/layout/PublicNav'
import { PublicFooter } from '@/components/layout/PublicFooter'

export const metadata: Metadata = {
  title: 'Pagamento confirmado | Mentoria Fábio Borges',
  description: 'Seu pagamento foi confirmado. Acesse sua área de aluno.',
}

export default function CheckoutSucessoPage() {
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
          background: #dcfce7;
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
      `}</style>

      <PublicNav />

      <div className="checkout-page">
        <div className="checkout-card">
          <div className="checkout-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h1>Pagamento confirmado!</h1>
          <p>
            Seu pagamento foi processado com sucesso. Seu acesso será liberado em
            instantes — em alguns casos pode levar até 1 minuto.
          </p>
          <a href="/dashboard" className="btn btn-primary btn-block">
            Acessar minha área de aluno
          </a>
        </div>
      </div>

      <PublicFooter />
    </>
  )
}
