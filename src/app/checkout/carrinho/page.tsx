'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CartItem, clearCart, readCart, writeCart } from '@/lib/cart/client'
import { PLANS } from '@/config/plans'
import { PublicNav } from '@/components/layout/PublicNav'
import { PublicFooter } from '@/components/layout/PublicFooter'

interface CourseSummary {
  id: string
  title: string
  slug: string
  isVip: boolean
  price: number | null
  priceCents: number
  canBuy: boolean
}

function money(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
}

export default function CheckoutCarrinhoPage() {
  const [items, setItems] = useState<CartItem[]>([])
  const [courses, setCourses] = useState<CourseSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [autoCheckout, setAutoCheckout] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponResult, setCouponResult] = useState<
    | { valid: true; discountCents: number; finalCents: number; label: string; couponId: string }
    | { valid: false; error: string }
    | null
  >(null)

  const planItem = items.find(
    (item): item is Extract<CartItem, { type: 'plan' }> => item.type === 'plan'
  )
  const courseItems = items.filter(
    (item): item is Extract<CartItem, { type: 'course' }> => item.type === 'course'
  )
  const courseIdsKey = useMemo(
    () =>
      items
        .filter((item): item is Extract<CartItem, { type: 'course' }> => item.type === 'course')
        .map((item) => item.courseId)
        .join('|'),
    [items]
  )
  const plan = planItem ? PLANS.find((entry) => entry.id === planItem.planId) : null
  const totalCents = useMemo(
    () => courses.reduce((sum, course) => sum + (course.canBuy ? course.priceCents : 0), 0),
    [courses]
  )

  useEffect(() => {
    setItems(readCart())
    const params = new URLSearchParams(window.location.search)
    if (params.get('autoCheckout') === '1') {
      setAutoCheckout(true)
      window.history.replaceState({}, '', '/checkout/carrinho')
    }
  }, [])

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
        if (!res.ok) {
          setErrorMsg(data.error ?? 'Erro ao carregar carrinho.')
          return
        }
        setCourses(data.courses ?? [])
      } catch {
        setErrorMsg('Erro de conexão ao carregar o carrinho.')
      } finally {
        setSummaryLoading(false)
      }
    }

    void loadSummary()
  }, [courseIdsKey])

  // Dispara checkout automaticamente ao voltar do cadastro/login
  useEffect(() => {
    if (autoCheckout && !summaryLoading && items.length > 0) {
      void finishCheckout()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCheckout, summaryLoading, items.length])

  function removeCourse(courseId: string) {
    const next = items.filter((item) => !(item.type === 'course' && item.courseId === courseId))
    writeCart(next)
    setItems(next)
  }

  function emptyCart() {
    clearCart()
    setItems([])
    setCourses([])
  }

  async function finishCheckout() {
    // Salva coupon em sessionStorage se houver
    if (couponResult?.valid && couponCode) {
      sessionStorage.setItem('ead-checkout-coupon', couponCode)
    }
    window.location.href = '/checkout/pagamento'
  }

  async function validateCoupon() {
    if (!couponCode) return
    setCouponLoading(true)
    try {
      const planIds = planItem ? [planItem.planId] : []
      const courseIdsArr = courseItems.map((i) => i.courseId)
      const total = planItem ? 0 : totalCents
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode,
          totalCents: total,
          orderType: planItem ? 'plan' : 'cart',
          planIds,
          courseIds: courseIdsArr,
        }),
      })
      const data = await res.json()
      setCouponResult(data)
    } catch {
      setCouponResult({ valid: false, error: 'Erro ao validar cupom.' })
    } finally {
      setCouponLoading(false)
    }
  }

  const hasBlockedCourse = courses.some((course) => !course.canBuy)
  const isEmpty = items.length === 0

  return (
    <>
      <PublicNav />
      <style>{`
        .cart-page{ min-height:100vh; background:#f8fafc; padding:48px 0; }
        .cart-shell{ width:min(960px,calc(100% - 32px)); margin:0 auto; }
        .cart-head{ display:flex; align-items:flex-end; justify-content:space-between; gap:16px; margin-bottom:24px; }
        .cart-head h1{ font-size:32px; margin:0 0 6px; letter-spacing:-.03em; }
        .cart-head p{ color:var(--muted); margin:0; }
        .cart-grid{ display:grid; grid-template-columns:1fr 320px; gap:24px; align-items:start; }
        .cart-panel{ background:#fff; border:1px solid var(--line); border-radius:12px; padding:20px; }
        .cart-item{ display:flex; align-items:center; justify-content:space-between; gap:16px; padding:16px 0; border-bottom:1px solid var(--line); }
        .cart-item:last-child{ border-bottom:0; }
        .cart-title{ font-weight:650; margin-bottom:4px; }
        .cart-meta{ font-size:13px; color:var(--muted); }
        .cart-price{ font-weight:700; white-space:nowrap; }
        .cart-remove{ border:0; background:transparent; color:#dc2626; cursor:pointer; font-size:13px; padding:6px; }
        .summary-line{ display:flex; justify-content:space-between; gap:16px; margin-bottom:12px; font-size:14px; }
        .summary-total{ display:flex; justify-content:space-between; gap:16px; border-top:1px solid var(--line); padding-top:16px; margin-top:16px; font-weight:750; font-size:18px; }
        .cart-actions{ display:flex; gap:10px; margin-top:18px; flex-wrap:wrap; }
        .cart-alert{ margin-top:14px; font-size:13px; color:#991b1b; background:#fef2f2; border:1px solid #fecaca; border-radius:8px; padding:10px 12px; line-height:1.5; }
        @media(max-width:820px){ .cart-grid{ grid-template-columns:1fr; } .cart-head{ align-items:flex-start; flex-direction:column; } }
      `}</style>

      <main className="cart-page">
        <div className="cart-shell">
          <div className="cart-head">
            <div>
              <h1>Carrinho</h1>
              <p>Revise seus itens antes de ir para o checkout.</p>
            </div>
            <Link href="/cursos" className="btn btn-ghost">
              Continuar comprando
            </Link>
          </div>

          {isEmpty ? (
            <div className="cart-panel">
              <h2 style={{ marginTop: 0 }}>Seu carrinho está vazio</h2>
              <p style={{ color: 'var(--muted)' }}>
                Escolha um curso ou plano para iniciar o checkout.
              </p>
              <Link href="/cursos" className="btn btn-primary">
                Ver cursos
              </Link>
            </div>
          ) : (
            <div className="cart-grid">
              <section className="cart-panel">
                {planItem && plan ? (
                  <div className="cart-item">
                    <div>
                      <div className="cart-title">Plano {plan.name}</div>
                      <div className="cart-meta">
                        {planItem.billingPeriod === 'annual' ? 'À vista' : '12x no cartão'}
                      </div>
                    </div>
                    <button className="cart-remove" onClick={emptyCart}>
                      Remover
                    </button>
                  </div>
                ) : summaryLoading ? (
                  <p style={{ color: 'var(--muted)' }}>Carregando itens...</p>
                ) : (
                  courses.map((course) => (
                    <div key={course.id} className="cart-item">
                      <div>
                        <div className="cart-title">{course.title}</div>
                        <div className="cart-meta">
                          {course.canBuy ? 'Curso avulso' : 'Disponível apenas via plano'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className="cart-price">
                          {course.canBuy ? money(course.priceCents) : 'VIP'}
                        </span>
                        <button className="cart-remove" onClick={() => removeCourse(course.id)}>
                          Remover
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </section>

              <aside className="cart-panel">
                <h2 style={{ fontSize: '20px', margin: '0 0 18px' }}>Resumo</h2>
                {planItem && plan ? (
                  <>
                    <div className="summary-line">
                      <span>{plan.name}</span>
                      <span>{planItem.billingPeriod === 'annual' ? 'À vista' : '12x'}</span>
                    </div>
                    <p style={{ color: 'var(--muted)', fontSize: '13px', lineHeight: 1.5 }}>
                      O valor final do plano será validado no checkout.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="summary-line">
                      <span>Cursos</span>
                      <span>{courses.filter((course) => course.canBuy).length}</span>
                    </div>
                    {couponResult?.valid && (
                      <div className="summary-line" style={{ color: '#166534' }}>
                        <span>Desconto ({couponCode})</span>
                        <span>-{money(couponResult.discountCents)}</span>
                      </div>
                    )}
                    <div className="summary-total">
                      <span>Total</span>
                      <span>
                        {money(couponResult?.valid ? couponResult.finalCents : totalCents)}
                      </span>
                    </div>
                  </>
                )}

                {/* Cupom */}
                <div style={{ margin: '16px 0 0' }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                    Cupom de desconto
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Codigo do cupom"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase())
                        setCouponResult(null)
                      }}
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        border: '1px solid var(--line)',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontFamily: 'monospace',
                      }}
                    />
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '8px 12px', fontSize: '13px' }}
                      onClick={validateCoupon}
                      disabled={couponLoading || !couponCode}
                    >
                      {couponLoading ? '...' : 'Aplicar'}
                    </button>
                  </div>
                  {couponResult?.valid && (
                    <div
                      style={{
                        marginTop: '8px',
                        fontSize: '13px',
                        color: '#166534',
                        background: '#f0fdf4',
                        border: '1px solid #86efac',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>{couponResult.label}</span>
                      <button
                        onClick={() => {
                          setCouponCode('')
                          setCouponResult(null)
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#166534',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        X
                      </button>
                    </div>
                  )}
                  {couponResult?.valid === false && (
                    <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '6px' }}>
                      {couponResult.error}
                    </p>
                  )}
                </div>

                {errorMsg && <div className="cart-alert">{errorMsg}</div>}
                {hasBlockedCourse && (
                  <div className="cart-alert">
                    Remova cursos VIP do carrinho avulso ou escolha um plano de mentoria.
                  </div>
                )}

                <div className="cart-actions">
                  <button
                    className="btn btn-primary btn-block"
                    disabled={loading || summaryLoading || hasBlockedCourse}
                    onClick={finishCheckout}
                    style={loading ? { opacity: 0.7, cursor: 'wait' } : undefined}
                  >
                    {loading ? 'Preparando...' : 'Finalizar checkout'}
                  </button>
                  <button className="btn btn-ghost btn-block" onClick={emptyCart}>
                    Esvaziar carrinho
                  </button>
                </div>

                {!planItem && (
                  <p
                    style={{
                      color: 'var(--muted)',
                      fontSize: '12px',
                      lineHeight: 1.5,
                      marginTop: '14px',
                    }}
                  >
                    Preços e disponibilidade são recalculados no servidor antes do pagamento.
                  </p>
                )}
              </aside>
            </div>
          )}
        </div>
      </main>
      <PublicFooter />
    </>
  )
}
