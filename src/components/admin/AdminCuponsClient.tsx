'use client'

import { useState } from 'react'

interface Coupon {
  id: string
  code: string
  description: string
  type: 'percentage' | 'fixed'
  value: number
  max_uses: number | null
  uses_count: number
  valid_from: string | null
  valid_until: string | null
  applies_to: 'all' | 'plans' | 'courses'
  plan_ids: string[]
  course_ids: string[]
  is_active: boolean
  created_at: string
}

type CouponFormData = {
  code: string
  description: string
  type: 'percentage' | 'fixed'
  value: string
  max_uses: string
  valid_from: string
  valid_until: string
  applies_to: 'all' | 'plans' | 'courses'
  plan_ids: string
  course_ids: string
  is_active: boolean
}

const emptyForm: CouponFormData = {
  code: '',
  description: '',
  type: 'percentage',
  value: '',
  max_uses: '',
  valid_from: '',
  valid_until: '',
  applies_to: 'all',
  plan_ids: '',
  course_ids: '',
  is_active: true,
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

function formatValue(type: 'percentage' | 'fixed', value: number) {
  if (type === 'percentage') return `${value}%`
  return `R$ ${(value / 100).toFixed(2).replace('.', ',')}`
}

export function AdminCuponsClient({
  initialCoupons,
}: {
  initialCoupons: Record<string, unknown>[]
}) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons as unknown as Coupon[])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CouponFormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setError(null)
    setModalOpen(true)
  }

  function openEdit(coupon: Coupon) {
    setEditingId(coupon.id)
    setForm({
      code: coupon.code,
      description: coupon.description,
      type: coupon.type,
      value: coupon.type === 'percentage' ? String(coupon.value) : String(coupon.value / 100),
      max_uses: coupon.max_uses ? String(coupon.max_uses) : '',
      valid_from: coupon.valid_from ? coupon.valid_from.slice(0, 10) : '',
      valid_until: coupon.valid_until ? coupon.valid_until.slice(0, 10) : '',
      applies_to: coupon.applies_to,
      plan_ids: (coupon.plan_ids ?? []).join(', '),
      course_ids: (coupon.course_ids ?? []).join(', '),
      is_active: coupon.is_active,
    })
    setError(null)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingId(null)
    setError(null)
  }

  function updateField<K extends keyof CouponFormData>(key: K, val: CouponFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: val }))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)

    const numericValue = parseFloat(form.value)
    if (isNaN(numericValue) || numericValue <= 0) {
      setError('Valor deve ser maior que zero.')
      setSaving(false)
      return
    }

    const payload = {
      code: form.code.toUpperCase().trim(),
      description: form.description,
      type: form.type,
      value: form.type === 'percentage' ? numericValue : Math.round(numericValue * 100),
      max_uses: form.max_uses ? parseInt(form.max_uses, 10) : null,
      valid_from: form.valid_from || null,
      valid_until: form.valid_until || null,
      applies_to: form.applies_to,
      plan_ids: form.plan_ids
        ? form.plan_ids
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      course_ids: form.course_ids
        ? form.course_ids
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      is_active: form.is_active,
    }

    try {
      const url = editingId ? `/api/admin/coupons/${editingId}` : '/api/admin/coupons'
      const method = editingId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erro ao salvar cupom.')
        setSaving(false)
        return
      }

      if (editingId) {
        setCoupons((prev) => prev.map((c) => (c.id === editingId ? (data.coupon as Coupon) : c)))
      } else {
        setCoupons((prev) => [data.coupon as Coupon, ...prev])
      }
      closeModal()
    } catch {
      setError('Erro de conexão.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(coupon: Coupon) {
    const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !coupon.is_active }),
    })
    if (res.ok) {
      const data = await res.json()
      setCoupons((prev) => prev.map((c) => (c.id === coupon.id ? (data.coupon as Coupon) : c)))
    }
  }

  async function deleteCoupon(coupon: Coupon) {
    if (!confirm(`Excluir cupom ${coupon.code}?`)) return
    const res = await fetch(`/api/admin/coupons/${coupon.id}`, { method: 'DELETE' })
    if (res.ok) {
      setCoupons((prev) => prev.filter((c) => c.id !== coupon.id))
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid var(--line)',
    borderRadius: '8px',
    fontSize: '13px',
    background: '#fff',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    marginBottom: '4px',
    color: 'var(--ink)',
  }

  return (
    <>
      <div className="topbar">
        <div className="crumb">Cupons de Desconto</div>
        <button className="btn btn-primary" onClick={openCreate}>
          + Novo Cupom
        </button>
      </div>

      <div className="content wide">
        <div className="card">
          <div className="card-pad">
            {coupons.length === 0 ? (
              <p className="muted">Nenhum cupom cadastrado.</p>
            ) : (
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Codigo</th>
                      <th>Tipo</th>
                      <th>Valor</th>
                      <th>Usos</th>
                      <th>Validade</th>
                      <th>Status</th>
                      <th>Acoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map((coupon) => (
                      <tr key={coupon.id}>
                        <td>
                          <code style={{ fontWeight: 700, fontSize: '13px' }}>{coupon.code}</code>
                          {coupon.description && (
                            <div
                              style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}
                            >
                              {coupon.description}
                            </div>
                          )}
                        </td>
                        <td>{coupon.type === 'percentage' ? '% Desconto' : 'R$ Fixo'}</td>
                        <td>{formatValue(coupon.type, coupon.value)}</td>
                        <td>
                          {coupon.uses_count}
                          {coupon.max_uses !== null ? ` / ${coupon.max_uses}` : ' / \u221E'}
                        </td>
                        <td>
                          {coupon.valid_from || coupon.valid_until ? (
                            <>
                              {formatDate(coupon.valid_from)} - {formatDate(coupon.valid_until)}
                            </>
                          ) : (
                            <span style={{ color: 'var(--muted)' }}>Sem expiracao</span>
                          )}
                        </td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              background: coupon.is_active ? '#dcfce7' : '#f3f4f6',
                              color: coupon.is_active ? '#166534' : '#6b7280',
                              padding: '3px 10px',
                              borderRadius: '999px',
                              fontSize: '12px',
                              fontWeight: 600,
                            }}
                          >
                            {coupon.is_active ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              className="btn btn-ghost"
                              style={{ padding: '4px 10px', fontSize: '12px' }}
                              onClick={() => openEdit(coupon)}
                            >
                              Editar
                            </button>
                            <button
                              className="btn btn-ghost"
                              style={{ padding: '4px 10px', fontSize: '12px' }}
                              onClick={() => toggleActive(coupon)}
                            >
                              {coupon.is_active ? 'Desativar' : 'Ativar'}
                            </button>
                            <button
                              className="btn btn-ghost"
                              style={{ padding: '4px 10px', fontSize: '12px', color: '#dc2626' }}
                              onClick={() => deleteCoupon(coupon)}
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal()
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '14px',
              width: 'min(520px, calc(100vw - 32px))',
              maxHeight: 'calc(100vh - 64px)',
              overflowY: 'auto',
              padding: '28px',
            }}
          >
            <h2 style={{ margin: '0 0 20px', fontSize: '20px' }}>
              {editingId ? 'Editar Cupom' : 'Novo Cupom'}
            </h2>

            {error && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '13px',
                  color: '#991b1b',
                  marginBottom: '16px',
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: 'grid', gap: '14px' }}>
              {/* Codigo */}
              <div>
                <label style={labelStyle}>Codigo *</label>
                <input
                  style={{ ...inputStyle, fontFamily: 'monospace', textTransform: 'uppercase' }}
                  value={form.code}
                  onChange={(e) => updateField('code', e.target.value.toUpperCase())}
                  placeholder="EX: DESCONTO20"
                />
              </div>

              {/* Descricao */}
              <div>
                <label style={labelStyle}>Descricao</label>
                <input
                  style={inputStyle}
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Descricao interna do cupom"
                />
              </div>

              {/* Tipo + Valor */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Tipo *</label>
                  <select
                    style={inputStyle}
                    value={form.type}
                    onChange={(e) => updateField('type', e.target.value as 'percentage' | 'fixed')}
                  >
                    <option value="percentage">Percentual (%)</option>
                    <option value="fixed">Valor fixo (R$)</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>
                    Valor * {form.type === 'percentage' ? '(%)' : '(R$)'}
                  </label>
                  <input
                    style={inputStyle}
                    type="number"
                    step={form.type === 'percentage' ? '1' : '0.01'}
                    min="0"
                    value={form.value}
                    onChange={(e) => updateField('value', e.target.value)}
                    placeholder={form.type === 'percentage' ? '20' : '50.00'}
                  />
                </div>
              </div>

              {/* Usos maximos */}
              <div>
                <label style={labelStyle}>Usos maximos (0 ou vazio = ilimitado)</label>
                <input
                  style={inputStyle}
                  type="number"
                  min="0"
                  value={form.max_uses}
                  onChange={(e) => updateField('max_uses', e.target.value)}
                  placeholder="Ilimitado"
                />
              </div>

              {/* Datas */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Valido de</label>
                  <input
                    style={inputStyle}
                    type="date"
                    value={form.valid_from}
                    onChange={(e) => updateField('valid_from', e.target.value)}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Valido ate</label>
                  <input
                    style={inputStyle}
                    type="date"
                    value={form.valid_until}
                    onChange={(e) => updateField('valid_until', e.target.value)}
                  />
                </div>
              </div>

              {/* Aplicavel a */}
              <div>
                <label style={labelStyle}>Aplicavel a</label>
                <select
                  style={inputStyle}
                  value={form.applies_to}
                  onChange={(e) =>
                    updateField('applies_to', e.target.value as 'all' | 'plans' | 'courses')
                  }
                >
                  <option value="all">Todos</option>
                  <option value="plans">Planos especificos</option>
                  <option value="courses">Cursos especificos</option>
                </select>
              </div>

              {form.applies_to === 'plans' && (
                <div>
                  <label style={labelStyle}>IDs dos planos (separados por virgula)</label>
                  <input
                    style={inputStyle}
                    value={form.plan_ids}
                    onChange={(e) => updateField('plan_ids', e.target.value)}
                    placeholder="basic, premium"
                  />
                </div>
              )}

              {form.applies_to === 'courses' && (
                <div>
                  <label style={labelStyle}>IDs dos cursos (separados por virgula)</label>
                  <input
                    style={inputStyle}
                    value={form.course_ids}
                    onChange={(e) => updateField('course_ids', e.target.value)}
                    placeholder="uuid1, uuid2"
                  />
                </div>
              )}

              {/* Status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={(e) => updateField('is_active', e.target.checked)}
                />
                <label htmlFor="is_active" style={{ fontSize: '13px', cursor: 'pointer' }}>
                  Cupom ativo
                </label>
              </div>
            </div>

            {/* Actions */}
            <div
              style={{
                display: 'flex',
                gap: '10px',
                justifyContent: 'flex-end',
                marginTop: '24px',
              }}
            >
              <button className="btn btn-ghost" onClick={closeModal} disabled={saving}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando...' : editingId ? 'Salvar alteracoes' : 'Criar cupom'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
