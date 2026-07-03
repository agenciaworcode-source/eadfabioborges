'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PublicNav } from '@/components/layout/PublicNav'
import { PublicFooter } from '@/components/layout/PublicFooter'
import { type CartItem, readCart, clearCart } from '@/lib/cart/client'
import { PLANS } from '@/config/plans'

/* ─── Types ─── */

interface CourseSummary {
  id: string
  title: string
  slug: string
  isVip: boolean
  price: number | null
  priceCents: number
  canBuy: boolean
}

type Step = 'form' | 'pix-pending' | 'boleto-pending' | 'processing'
type PaymentTab = 'credit_card' | 'pix' | 'boleto'

interface PixData {
  qrCode: string
  qrCodeUrl: string
}

interface BoletoData {
  url: string
  line: string
  dueAt: string
}

/* ─── Helpers ─── */

function money(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
}

function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function formatCep(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 16)
  return digits.replace(/(.{4})/g, '$1 ').trim()
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR')
  } catch {
    return iso
  }
}

/* ─── Component ─── */

export default function CheckoutPagamentoPage() {
  const router = useRouter()

  /* Cart state */
  const [items, setItems] = useState<CartItem[]>([])
  const [courses, setCourses] = useState<CourseSummary[]>([])
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')

  /* Form fields */
  const [customerName, setCustomerName] = useState('')
  const [cpf, setCpf] = useState('')
  const [phone, setPhone] = useState('')
  const [activeTab, setActiveTab] = useState<PaymentTab>('credit_card')

  /* Card fields */
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [installments, setInstallments] = useState(1)

  /* Billing address (exigido pelo gateway para cartão) */
  const [billingZip, setBillingZip] = useState('')
  const [billingLine1, setBillingLine1] = useState('')
  const [billingCity, setBillingCity] = useState('')
  const [billingState, setBillingState] = useState('')

  /* UI state */
  const [step, setStep] = useState<Step>('form')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [pixData, setPixData] = useState<PixData | null>(null)
  const [boletoData, setBoletoData] = useState<BoletoData | null>(null)
  const [copied, setCopied] = useState(false)

  const planItem = items.find(
    (item): item is Extract<CartItem, { type: 'plan' }> => item.type === 'plan'
  )
  const plan = planItem ? PLANS.find((entry) => entry.id === planItem.planId) : null

  const courseIdsKey = useMemo(
    () =>
      items
        .filter((item): item is Extract<CartItem, { type: 'course' }> => item.type === 'course')
        .map((item) => item.courseId)
        .join('|'),
    [items]
  )

  const totalCents = useMemo(
    () => courses.reduce((sum, course) => sum + (course.canBuy ? course.priceCents : 0), 0),
    [courses]
  )

  /* ─── Load cart ─── */
  useEffect(() => {
    const cart = readCart()
    if (cart.length === 0) {
      router.replace('/checkout/carrinho')
      return
    }
    setItems(cart)
  }, [router])

  /* ─── Load user email (redireciona se não autenticado) ─── */
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/api/auth/me')
        if (res.status === 401) {
          window.location.href = `/auth/login?returnUrl=${encodeURIComponent('/checkout/pagamento')}`
          return
        }
        if (res.ok) {
          const data = (await res.json()) as { email?: string; name?: string }
          if (data.email) setUserEmail(data.email)
          if (data.name && !customerName) setCustomerName(data.name)
        }
      } catch {
        /* ignore */
      }
    }
    void loadUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ─── Load course summary ─── */
  useEffect(() => {
    async function loadSummary() {
      const courseIds = courseIdsKey ? courseIdsKey.split('|') : []
      if (courseIds.length === 0) {
        setCourses([])
        setSummaryLoading(false)
        return
      }

      setSummaryLoading(true)
      try {
        const res = await fetch('/api/checkout/carrinho/resumo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseIds }),
        })
        const data = (await res.json()) as {
          courses?: CourseSummary[]
          error?: string
        }
        if (res.ok) setCourses(data.courses ?? [])
      } catch {
        /* ignore */
      } finally {
        setSummaryLoading(false)
      }
    }

    void loadSummary()
  }, [courseIdsKey])

  /* ─── Copy to clipboard ─── */
  const copyText = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* fallback ignored */
    }
  }, [])

  /* ─── Submit payment ─── */
  async function handleSubmit() {
    setErrorMsg(null)
    setLoading(true)
    setStep('processing')

    try {
      const doc = cpf.replace(/\D/g, '')
      if (doc.length !== 11) {
        setErrorMsg('CPF é obrigatório para realizar o pagamento.')
        setStep('form')
        setLoading(false)
        return
      }

      const phoneDigits = phone.replace(/\D/g, '')
      if (phoneDigits.length < 10) {
        setErrorMsg('Telefone com DDD é obrigatório para realizar o pagamento.')
        setStep('form')
        setLoading(false)
        return
      }

      let payment: Record<string, unknown>

      if (activeTab === 'credit_card') {
        /* Envia dados do cartão para o backend tokenizar (evita CORS) */
        const [expMonth, expYear] = cardExpiry.split('/')
        payment = {
          method: 'credit_card',
          cardNumber: cardNumber.replace(/\s/g, ''),
          cardName,
          expMonth,
          expYear: expYear ? `20${expYear}` : '',
          cvv: cardCvv,
          installments,
          billingAddress: {
            line1: billingLine1,
            zipCode: billingZip.replace(/\D/g, ''),
            city: billingCity,
            state: billingState,
          },
        }
      } else if (activeTab === 'pix') {
        payment = { method: 'pix' }
      } else {
        payment = { method: 'boleto', customerDocument: doc }
      }

      const res = await fetch('/api/checkout/transparente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'cart',
          items,
          customerName,
          customerDocument: doc,
          customerPhone: phoneDigits,
          payment,
        }),
      })

      if (res.status === 401) {
        window.location.href = `/auth/cadastro?returnUrl=${encodeURIComponent('/checkout/pagamento')}`
        return
      }

      const data = (await res.json()) as {
        method?: string
        redirect?: string
        qrCode?: string
        qrCodeUrl?: string
        orderId?: string
        url?: string
        line?: string
        dueAt?: string
        error?: string
      }

      if (!res.ok) {
        setErrorMsg(data.error ?? 'Erro ao processar pagamento.')
        setStep('form')
        setLoading(false)
        return
      }

      switch (data.method) {
        case 'credit_card':
          clearCart()
          if (data.redirect) {
            window.location.href = data.redirect
          }
          break

        case 'pix':
          setPixData({
            qrCode: data.qrCode ?? '',
            qrCodeUrl: data.qrCodeUrl ?? '',
          })
          setStep('pix-pending')
          break

        case 'boleto':
          setBoletoData({
            url: data.url ?? '',
            line: data.line ?? '',
            dueAt: data.dueAt ?? '',
          })
          setStep('boleto-pending')
          break
      }
    } catch {
      setErrorMsg('Erro de conexão. Tente novamente.')
      setStep('form')
    } finally {
      setLoading(false)
    }
  }

  /* ─── Render ─── */

  return (
    <>
      <PublicNav />
      <style>{`
        .pg-page{ min-height:100vh; background:#f8fafc; padding:48px 0; }
        .pg-shell{ width:min(960px,calc(100% - 32px)); margin:0 auto; }
        .pg-head h1{ font-size:28px; margin:0 0 24px; letter-spacing:-.03em; }
        .pg-grid{ display:grid; grid-template-columns:1fr 320px; gap:24px; align-items:start; }
        .pg-panel{ background:#fff; border:1px solid var(--line); border-radius:12px; padding:20px; }
        .form-section{ margin-bottom:24px; }
        .form-section h2{ font-size:18px; margin:0 0 14px; }
        .form-row{ margin-bottom:14px; }
        .form-row label{ display:block; font-size:13px; font-weight:600; margin-bottom:5px; color:var(--ink); }
        .form-row input, .form-row select{ width:100%; padding:10px 12px; border:1px solid var(--line); border-radius:8px; font-size:14px; background:#fff; box-sizing:border-box; }
        .form-row input:focus, .form-row select:focus{ outline:none; border-color:var(--ink); }
        .form-row input[readonly]{ background:#f4f4f5; color:var(--muted); }
        .form-row-inline{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }

        .payment-tabs{ display:flex; gap:0; margin-bottom:18px; border:1px solid var(--line); border-radius:8px; overflow:hidden; }
        .payment-tab{ flex:1; padding:10px 0; text-align:center; font-size:14px; font-weight:600; cursor:pointer; border:0; background:#fff; color:var(--muted); transition:all .15s; }
        .payment-tab.active{ background:var(--ink); color:#fff; }

        .summary-line{ display:flex; justify-content:space-between; gap:16px; margin-bottom:10px; font-size:14px; }
        .summary-total{ display:flex; justify-content:space-between; gap:16px; border-top:1px solid var(--line); padding-top:14px; margin-top:14px; font-weight:750; font-size:18px; }

        .pg-alert{ margin-top:14px; font-size:13px; color:#991b1b; background:#fef2f2; border:1px solid #fecaca; border-radius:8px; padding:10px 12px; line-height:1.5; }

        .pix-container, .boleto-container{ text-align:center; padding:20px 0; }
        .pix-container img{ border-radius:8px; margin-bottom:16px; }
        .copy-row{ display:flex; gap:8px; align-items:center; margin:12px 0; }
        .copy-row code{ flex:1; padding:10px; background:#f4f4f5; border-radius:8px; font-size:12px; word-break:break-all; text-align:left; }
        .boleto-line{ font-size:14px; letter-spacing:.5px; }
        .muted{ color:var(--muted); font-size:13px; margin-top:12px; }
        .processing-msg{ text-align:center; padding:40px 0; color:var(--muted); }

        @media(max-width:820px){
          .pg-grid{ grid-template-columns:1fr; }
          .form-row-inline{ grid-template-columns:1fr; }
        }
      `}</style>

      <main className="pg-page">
        <div className="pg-shell">
          <div className="pg-head">
            <h1>Finalizar Pagamento</h1>
          </div>

          <div className="pg-grid">
            {/* ─── Left: form ─── */}
            <div>
              {step === 'processing' && (
                <div className="pg-panel processing-msg">
                  <p>Processando pagamento...</p>
                </div>
              )}

              {step === 'pix-pending' && pixData && (
                <div className="pg-panel pix-container">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pixData.qrCodeUrl} alt="QR Code PIX" width={200} height={200} />
                  <p>Copie o codigo PIX:</p>
                  <div className="copy-row">
                    <code>{pixData.qrCode}</code>
                    <button className="btn btn-ghost" onClick={() => void copyText(pixData.qrCode)}>
                      {copied ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                  <p className="muted">
                    Valido por 1 hora. Apos o pagamento, seu acesso e liberado automaticamente.
                  </p>
                </div>
              )}

              {step === 'boleto-pending' && boletoData && (
                <div className="pg-panel boleto-container">
                  <p>Linha digitavel:</p>
                  <div className="copy-row">
                    <code className="boleto-line">{boletoData.line}</code>
                    <button
                      className="btn btn-ghost"
                      onClick={() => void copyText(boletoData.line)}
                    >
                      {copied ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                  <a
                    href={boletoData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost"
                  >
                    Ver boleto PDF
                  </a>
                  <p className="muted">Vencimento: {formatDate(boletoData.dueAt)}</p>
                </div>
              )}

              {step === 'form' && (
                <>
                  {/* Customer data */}
                  <section className="pg-panel form-section">
                    <h2>Seus dados</h2>
                    <div className="form-row">
                      <label htmlFor="customerName">Nome completo</label>
                      <input
                        id="customerName"
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        required
                        minLength={3}
                        placeholder="Seu nome completo"
                      />
                    </div>
                    <div className="form-row">
                      <label htmlFor="cpf">CPF</label>
                      <input
                        id="cpf"
                        type="text"
                        value={cpf}
                        onChange={(e) => setCpf(formatCpf(e.target.value))}
                        placeholder="000.000.000-00"
                        inputMode="numeric"
                        required
                      />
                    </div>
                    <div className="form-row">
                      <label htmlFor="phone">Telefone (com DDD)</label>
                      <input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(formatPhone(e.target.value))}
                        placeholder="(00) 00000-0000"
                        inputMode="numeric"
                        required
                      />
                    </div>
                    <div className="form-row">
                      <label htmlFor="email">E-mail</label>
                      <input id="email" type="email" value={userEmail} readOnly />
                    </div>
                  </section>

                  {/* Payment tabs */}
                  <section className="pg-panel form-section">
                    <h2>Forma de pagamento</h2>

                    <div className="payment-tabs">
                      {(['credit_card', 'pix', 'boleto'] as const).map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          className={`payment-tab${activeTab === tab ? ' active' : ''}`}
                          onClick={() => {
                            setActiveTab(tab)
                            setErrorMsg(null)
                          }}
                        >
                          {tab === 'credit_card' ? 'Cartao' : tab === 'pix' ? 'PIX' : 'Boleto'}
                        </button>
                      ))}
                    </div>

                    {/* Tab: Credit Card */}
                    {activeTab === 'credit_card' && (
                      <>
                        <div className="form-row">
                          <label htmlFor="cardNumber">Numero do cartao</label>
                          <input
                            id="cardNumber"
                            type="text"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                            placeholder="0000 0000 0000 0000"
                            inputMode="numeric"
                            maxLength={19}
                          />
                        </div>
                        <div className="form-row">
                          <label htmlFor="cardName">Nome no cartao</label>
                          <input
                            id="cardName"
                            type="text"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value.toUpperCase())}
                            placeholder="NOME IMPRESSO NO CARTAO"
                          />
                        </div>
                        <div className="form-row-inline">
                          <div className="form-row">
                            <label htmlFor="cardExpiry">Validade</label>
                            <input
                              id="cardExpiry"
                              type="text"
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                              placeholder="MM/AA"
                              inputMode="numeric"
                              maxLength={5}
                            />
                          </div>
                          <div className="form-row">
                            <label htmlFor="cardCvv">CVV</label>
                            <input
                              id="cardCvv"
                              type="text"
                              value={cardCvv}
                              onChange={(e) =>
                                setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))
                              }
                              placeholder="000"
                              inputMode="numeric"
                              maxLength={4}
                            />
                          </div>
                        </div>
                        <div className="form-row">
                          <label htmlFor="installments">Parcelas</label>
                          <select
                            id="installments"
                            value={installments}
                            onChange={(e) => setInstallments(Number(e.target.value))}
                          >
                            {[1, 2, 3, 6, 12].map((n) => (
                              <option key={n} value={n}>
                                {n}x{' '}
                                {totalCents > 0 ? `de ${money(Math.ceil(totalCents / n))}` : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Endereço de cobrança (exigido pelo gateway) */}
                        <div className="form-row-inline">
                          <div className="form-row">
                            <label htmlFor="billingZip">CEP</label>
                            <input
                              id="billingZip"
                              type="text"
                              value={billingZip}
                              onChange={(e) => setBillingZip(formatCep(e.target.value))}
                              placeholder="00000-000"
                              inputMode="numeric"
                              maxLength={9}
                              required
                            />
                          </div>
                          <div className="form-row">
                            <label htmlFor="billingState">UF</label>
                            <input
                              id="billingState"
                              type="text"
                              value={billingState}
                              onChange={(e) =>
                                setBillingState(
                                  e.target.value
                                    .replace(/[^a-zA-Z]/g, '')
                                    .toUpperCase()
                                    .slice(0, 2)
                                )
                              }
                              placeholder="SP"
                              maxLength={2}
                              required
                            />
                          </div>
                        </div>
                        <div className="form-row">
                          <label htmlFor="billingLine1">Endereço (rua e número)</label>
                          <input
                            id="billingLine1"
                            type="text"
                            value={billingLine1}
                            onChange={(e) => setBillingLine1(e.target.value)}
                            placeholder="Av. Paulista, 1000"
                            required
                          />
                        </div>
                        <div className="form-row">
                          <label htmlFor="billingCity">Cidade</label>
                          <input
                            id="billingCity"
                            type="text"
                            value={billingCity}
                            onChange={(e) => setBillingCity(e.target.value)}
                            placeholder="São Paulo"
                            required
                          />
                        </div>
                        <button
                          className="btn btn-primary btn-block"
                          disabled={
                            loading ||
                            !customerName ||
                            !cardNumber ||
                            !cardName ||
                            !cardExpiry ||
                            !cardCvv ||
                            !billingZip ||
                            !billingLine1 ||
                            !billingCity ||
                            billingState.length !== 2
                          }
                          onClick={() => void handleSubmit()}
                          style={loading ? { opacity: 0.7, cursor: 'wait' } : undefined}
                        >
                          {loading ? 'Processando...' : 'Pagar com cartao'}
                        </button>
                      </>
                    )}

                    {/* Tab: PIX */}
                    {activeTab === 'pix' && (
                      <>
                        <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
                          Gere o QR Code e pague pelo app do seu banco.
                        </p>
                        <button
                          className="btn btn-primary btn-block"
                          disabled={loading || !customerName}
                          onClick={() => void handleSubmit()}
                          style={loading ? { opacity: 0.7, cursor: 'wait' } : undefined}
                        >
                          {loading ? 'Gerando...' : 'Gerar codigo PIX'}
                        </button>
                      </>
                    )}

                    {/* Tab: Boleto */}
                    {activeTab === 'boleto' && (
                      <>
                        <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
                          Vencimento em 3 dias uteis.
                        </p>
                        <div className="form-row">
                          <label htmlFor="boletoCpf">CPF (obrigatorio para boleto)</label>
                          <input
                            id="boletoCpf"
                            type="text"
                            value={cpf}
                            onChange={(e) => setCpf(formatCpf(e.target.value))}
                            placeholder="000.000.000-00"
                            inputMode="numeric"
                          />
                        </div>
                        <button
                          className="btn btn-primary btn-block"
                          disabled={
                            loading || !customerName || cpf.replace(/\D/g, '').length !== 11
                          }
                          onClick={() => void handleSubmit()}
                          style={loading ? { opacity: 0.7, cursor: 'wait' } : undefined}
                        >
                          {loading ? 'Gerando...' : 'Gerar boleto'}
                        </button>
                      </>
                    )}

                    {errorMsg && <div className="pg-alert">{errorMsg}</div>}
                  </section>
                </>
              )}
            </div>

            {/* ─── Right: summary ─── */}
            <aside className="pg-panel">
              <h2 style={{ fontSize: '20px', margin: '0 0 18px' }}>Resumo</h2>

              {planItem && plan ? (
                <>
                  <div className="summary-line">
                    <span>Plano {plan.name}</span>
                    <span>{planItem.billingPeriod === 'annual' ? 'A vista' : '12x'}</span>
                  </div>
                  <p
                    style={{
                      color: 'var(--muted)',
                      fontSize: '13px',
                      lineHeight: 1.5,
                    }}
                  >
                    O valor final sera validado no servidor.
                  </p>
                </>
              ) : summaryLoading ? (
                <p style={{ color: 'var(--muted)' }}>Carregando...</p>
              ) : (
                <>
                  {courses.map((course) => (
                    <div key={course.id} className="summary-line">
                      <span>{course.title}</span>
                      <span>{course.canBuy ? money(course.priceCents) : 'VIP'}</span>
                    </div>
                  ))}
                  <div className="summary-total">
                    <span>Total</span>
                    <span>{money(totalCents)}</span>
                  </div>
                </>
              )}
            </aside>
          </div>
        </div>
      </main>
      <PublicFooter />
    </>
  )
}
