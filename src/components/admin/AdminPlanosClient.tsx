'use client'

import { useState } from 'react'

interface PlanRow {
  id: string
  name: string
  price_monthly: number
  price_annual: number
  sort_order: number
  is_active: boolean
  updated_at: string
}

interface EditState {
  price_monthly: string
  price_annual: string
}

function formatR(cents: number): string {
  if (cents === 0) return '0'
  return (cents / 100).toFixed(2).replace('.', ',')
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AdminPlanosClient({ plans: initialPlans }: { plans: PlanRow[] }) {
  const [plans, setPlans] = useState<PlanRow[]>(initialPlans)
  const [editing, setEditing] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<EditState>({ price_monthly: '', price_annual: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ id: string; text: string; ok: boolean } | null>(null)

  function startEdit(plan: PlanRow) {
    setEditing(plan.id)
    setEditValues({
      price_monthly: plan.price_monthly > 0 ? (plan.price_monthly / 100).toFixed(2) : '0',
      price_annual: plan.price_annual > 0 ? (plan.price_annual / 100).toFixed(2) : '0',
    })
    setMsg(null)
  }

  function cancelEdit() {
    setEditing(null)
  }

  async function saveEdit(planId: string) {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/plans/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price_monthly: parseFloat(editValues.price_monthly.replace(',', '.')) || 0,
          price_annual: parseFloat(editValues.price_annual.replace(',', '.')) || 0,
        }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        setMsg({ id: planId, text: data.error ?? 'Erro ao salvar', ok: false })
        return
      }

      const data = (await res.json()) as { plan: PlanRow }
      setPlans((prev) => prev.map((p) => (p.id === planId ? data.plan : p)))
      setEditing(null)
      setMsg({ id: planId, text: 'Preços atualizados com sucesso', ok: true })
      setTimeout(() => setMsg(null), 3000)
    } catch {
      setMsg({ id: planId, text: 'Erro de conexão', ok: false })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <style>{`
        .planos-admin{ padding:32px 0 80px; }
        .planos-admin h2{ font-size:24px; margin-bottom:6px; }
        .planos-admin .sub{ color:var(--muted); font-size:14px; margin-bottom:28px; }
        .plans-table{ width:100%; border-collapse:collapse; }
        .plans-table th{ font-size:12px; font-weight:600; color:var(--muted); text-transform:uppercase; letter-spacing:.04em; padding:10px 14px; text-align:left; border-bottom:1px solid var(--line); }
        .plans-table td{ padding:14px 14px; border-bottom:1px solid var(--line); font-size:14px; vertical-align:middle; }
        .plans-table tr:last-child td{ border-bottom:none; }
        .plans-table input[type=text]{ border:1px solid var(--line); border-radius:6px; padding:5px 8px; font-size:14px; width:100px; }
        .plans-table input[type=text]:focus{ outline:none; border-color:var(--blue); }
        .edit-actions{ display:flex; gap:8px; }
        .alert-inline{ margin-top:12px; font-size:13px; padding:8px 14px; border-radius:8px; }
        .alert-inline.ok{ background:var(--green-tint); color:#178a4a; }
        .alert-inline.err{ background:#fef2f2; color:#b91c1c; }
      `}</style>

      <div className="content wide planos-admin">
        <h2>Gerenciar Planos</h2>
        <p className="sub">
          Ajuste preços diretamente no banco — nenhum redeploy necessário.
          Valores em R$ (reais).
        </p>

        <div className="card">
          <table className="plans-table">
            <thead>
              <tr>
                <th>Plano</th>
                <th>Preço Mensal (R$)</th>
                <th>Preço Anual (R$)</th>
                <th>Atualizado em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id}>
                  <td>
                    <span className={`plan-badge plan-${plan.id}`} style={{ textTransform: 'capitalize' }}>
                      {plan.name}
                    </span>
                  </td>
                  <td>
                    {editing === plan.id ? (
                      <input
                        type="text"
                        value={editValues.price_monthly}
                        onChange={(e) =>
                          setEditValues((v) => ({ ...v, price_monthly: e.target.value }))
                        }
                        placeholder="0,00"
                      />
                    ) : plan.price_monthly === 0 ? (
                      <span className="muted">Sob consulta</span>
                    ) : (
                      <span>R$ {formatR(plan.price_monthly)}</span>
                    )}
                  </td>
                  <td>
                    {editing === plan.id ? (
                      <input
                        type="text"
                        value={editValues.price_annual}
                        onChange={(e) =>
                          setEditValues((v) => ({ ...v, price_annual: e.target.value }))
                        }
                        placeholder="0,00"
                      />
                    ) : plan.price_annual === 0 ? (
                      <span className="muted">Sob consulta</span>
                    ) : (
                      <span>R$ {formatR(plan.price_annual)}</span>
                    )}
                  </td>
                  <td>
                    <span className="muted" style={{ fontSize: '13px' }}>
                      {formatDate(plan.updated_at)}
                    </span>
                  </td>
                  <td>
                    {editing === plan.id ? (
                      <div className="edit-actions">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => saveEdit(plan.id)}
                          disabled={saving}
                        >
                          {saving ? 'Salvando…' : 'Salvar'}
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={cancelEdit}
                          disabled={saving}
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => startEdit(plan)}
                      >
                        Editar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {msg && (
            <div className={`alert-inline ${msg.ok ? 'ok' : 'err'}`}>{msg.text}</div>
          )}
        </div>

        <div className="card card-pad" style={{ marginTop: '20px', background: 'var(--blue-50, #eff6ff)' }}>
          <p style={{ fontSize: '13.5px', color: 'var(--ink-2)', margin: 0 }}>
            <strong>Para integrar um gateway de pagamento:</strong> crie{' '}
            <code>src/lib/checkout/providers/[nome].ts</code> implementando{' '}
            <code>CheckoutProvider</code> e configure{' '}
            <code>CHECKOUT_PROVIDER=[nome]</code> nas variáveis de ambiente.
            Nenhuma outra mudança na plataforma é necessária.
          </p>
        </div>
      </div>
    </>
  )
}
