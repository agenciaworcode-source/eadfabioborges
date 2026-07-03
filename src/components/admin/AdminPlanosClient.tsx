'use client'

import { useState, useMemo, useCallback } from 'react'

/* ---------- Types ---------- */

interface PlanRow {
  id: string
  name: string
  description: string
  features: string[]
  badge: string
  audience: string
  hierarchy_level: number
  is_featured: boolean
  includes_all_courses: boolean
  billing_options: string[]
  price_monthly: number
  price_annual: number
  sort_order: number
  is_active: boolean
  updated_at: string
}

interface CourseRow {
  id: string
  title: string
  slug: string
  published: boolean
}

interface PlanCourseRow {
  course_id: string
  courses: { id: string; title: string; slug: string; published: boolean }
}

type Tab = 'conteudo' | 'precos' | 'cursos'

/* ---------- Helpers ---------- */

function formatR(cents: number): string {
  if (cents === 0) return 'Sob consulta'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
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

/* ---------- Component ---------- */

export function AdminPlanosClient({
  plans: initialPlans,
  allCourses,
}: {
  plans: PlanRow[]
  allCourses: CourseRow[]
}) {
  const [plans, setPlans] = useState<PlanRow[]>(initialPlans)
  const [selectedId, setSelectedId] = useState<string | null>(initialPlans[0]?.id ?? null)
  const [activeTab, setActiveTab] = useState<Tab>('conteudo')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{
    text: string
    ok: boolean
  } | null>(null)

  // Draft state for editing
  const [draft, setDraft] = useState<Partial<PlanRow>>({})
  const [newFeature, setNewFeature] = useState('')

  // Plan courses state
  const [planCourses, setPlanCourses] = useState<PlanCourseRow[]>([])
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [courseSearch, setCourseSearch] = useState('')

  const selected = useMemo(
    () => plans.find((p) => p.id === selectedId) ?? null,
    [plans, selectedId]
  )

  // Merged view: selected + draft overrides
  const merged = useMemo(() => {
    if (!selected) return null
    return { ...selected, ...draft }
  }, [selected, draft])

  function showToast(text: string, ok: boolean) {
    setToast({ text, ok })
    setTimeout(() => setToast(null), 3500)
  }

  function selectPlan(id: string) {
    setSelectedId(id)
    setDraft({})
    setNewFeature('')
    setActiveTab('conteudo')
    setPlanCourses([])
  }

  function updateDraft(field: string, value: unknown) {
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  /* ---- Features management ---- */
  function currentFeatures(): string[] {
    return (draft.features ?? selected?.features ?? []) as string[]
  }

  function addFeature() {
    const val = newFeature.trim()
    if (!val) return
    updateDraft('features', [...currentFeatures(), val])
    setNewFeature('')
  }

  function removeFeature(idx: number) {
    const feats = [...currentFeatures()]
    feats.splice(idx, 1)
    updateDraft('features', feats)
  }

  function moveFeature(idx: number, dir: -1 | 1) {
    const feats = [...currentFeatures()]
    const target = idx + dir
    if (target < 0 || target >= feats.length) return
    ;[feats[idx], feats[target]] = [feats[target], feats[idx]]
    updateDraft('features', feats)
  }

  /* ---- Save ---- */
  async function save() {
    if (!selected || Object.keys(draft).length === 0) return
    setSaving(true)
    try {
      const body: Record<string, unknown> = { ...draft }
      // Convert prices from display (reais) to API (reais — API converts to cents)
      if (typeof body.price_monthly === 'number') {
        body.price_monthly = body.price_monthly / 100
      }
      if (typeof body.price_annual === 'number') {
        body.price_annual = body.price_annual / 100
      }

      const res = await fetch(`/api/admin/plans/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        showToast(data.error ?? 'Erro ao salvar', false)
        return
      }

      const data = (await res.json()) as { plan: PlanRow }
      setPlans((prev) => prev.map((p) => (p.id === selected.id ? data.plan : p)))
      setDraft({})
      showToast('Plano atualizado com sucesso', true)
    } catch {
      showToast('Erro de conexao', false)
    } finally {
      setSaving(false)
    }
  }

  /* ---- Courses tab ---- */
  const fetchPlanCourses = useCallback(async (planId: string) => {
    setLoadingCourses(true)
    try {
      const res = await fetch(`/api/admin/plans/${planId}/courses`)
      const data = (await res.json()) as { courses: PlanCourseRow[] }
      setPlanCourses(data.courses ?? [])
    } catch {
      setPlanCourses([])
    } finally {
      setLoadingCourses(false)
    }
  }, [])

  function openCoursesTab() {
    setActiveTab('cursos')
    if (selected) {
      fetchPlanCourses(selected.id)
    }
  }

  async function addCourseToplan(courseId: string) {
    if (!selected) return
    try {
      const res = await fetch(`/api/admin/plans/${selected.id}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      })
      if (res.ok) {
        await fetchPlanCourses(selected.id)
        showToast('Curso adicionado ao plano', true)
      }
    } catch {
      showToast('Erro ao adicionar curso', false)
    }
  }

  async function removeCourseFromPlan(courseId: string) {
    if (!selected) return
    try {
      const res = await fetch(`/api/admin/plans/${selected.id}/courses`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      })
      if (res.ok) {
        await fetchPlanCourses(selected.id)
        showToast('Curso removido do plano', true)
      }
    } catch {
      showToast('Erro ao remover curso', false)
    }
  }

  const planCourseIds = useMemo(() => new Set(planCourses.map((pc) => pc.course_id)), [planCourses])

  const availableCourses = useMemo(() => {
    const q = courseSearch.trim().toLowerCase()
    return allCourses.filter((c) => {
      if (planCourseIds.has(c.id)) return false
      if (q && !c.title.toLowerCase().includes(q)) return false
      return true
    })
  }, [allCourses, planCourseIds, courseSearch])

  const hasDraftChanges = Object.keys(draft).length > 0

  return (
    <>
      <style>{`
        .plan-admin{ padding:32px 0 80px; }
        .plan-admin h1{ font-size:28px; margin:0 0 6px; }
        .plan-admin .sub{ color:var(--muted); font-size:14.5px; margin-bottom:24px; }
        .plan-grid{ display:grid; grid-template-columns:280px minmax(0,1fr); gap:22px; align-items:start; }
        .plan-list .plan-item{ display:flex; align-items:center; gap:10px; padding:12px 14px; border:1px solid var(--line); border-radius:10px; background:#fff; margin-bottom:8px; cursor:pointer; transition:border-color .15s, box-shadow .15s; }
        .plan-item:hover{ border-color:var(--blue); }
        .plan-item.sel{ border-color:var(--blue); box-shadow:0 0 0 3px rgba(72,161,254,.12); }
        .plan-item .plan-dot{ width:10px; height:10px; border-radius:50%; flex-shrink:0; }
        .plan-item h3{ font-size:14px; margin:0; line-height:1.2; }
        .plan-item .plan-sub{ font-size:12px; color:var(--muted); margin-top:2px; }
        .plan-item .plan-right{ margin-left:auto; text-align:right; flex-shrink:0; }
        .plan-item .plan-price{ font-size:13px; font-weight:700; color:var(--ink); }
        .plan-item .plan-status{ font-size:11px; }
        .plan-editor{ position:sticky; top:20px; }
        .plan-tabs{ display:flex; gap:4px; padding:4px; background:var(--surface-2); border-radius:10px; margin-bottom:18px; }
        .plan-tab{ flex:1; border:0; background:transparent; border-radius:8px; padding:8px 10px; font-size:13px; font-weight:700; color:var(--muted); cursor:pointer; transition:background .15s, color .15s; }
        .plan-tab.active{ background:#fff; color:var(--blue); box-shadow:0 1px 3px rgba(0,0,0,.1); }
        .plan-field{ margin-bottom:16px; }
        .plan-field label{ display:block; font-size:12px; font-weight:600; color:var(--muted); text-transform:uppercase; letter-spacing:.04em; margin-bottom:5px; }
        .plan-field input[type=text], .plan-field input[type=number], .plan-field textarea, .plan-field select{
          width:100%; border:1px solid var(--line); border-radius:8px; padding:8px 10px; font:inherit; font-size:14px; background:#fff;
        }
        .plan-field input:focus, .plan-field textarea:focus, .plan-field select:focus{ outline:none; border-color:var(--blue); }
        .plan-field textarea{ min-height:80px; resize:vertical; }
        .plan-row{ display:flex; gap:14px; }
        .plan-row .plan-field{ flex:1; }
        .plan-check{ display:flex; align-items:center; gap:8px; margin-bottom:14px; cursor:pointer; }
        .plan-check input{ width:18px; height:18px; accent-color:var(--blue); }
        .plan-check span{ font-size:14px; }
        .feat-list{ list-style:none; padding:0; margin:0 0 10px; }
        .feat-item{ display:flex; align-items:center; gap:6px; padding:7px 8px; border:1px solid var(--line); border-radius:8px; margin-bottom:6px; background:#fff; font-size:13.5px; }
        .feat-item .feat-text{ flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .feat-item button{ border:0; background:transparent; cursor:pointer; font-size:14px; color:var(--muted); padding:2px 4px; border-radius:4px; }
        .feat-item button:hover{ background:var(--surface-2); color:var(--ink); }
        .feat-add{ display:flex; gap:6px; }
        .feat-add input{ flex:1; }
        .plan-actions{ display:flex; gap:10px; margin-top:22px; padding-top:16px; border-top:1px solid var(--line); }
        .plan-toast{ position:fixed; bottom:24px; right:24px; padding:12px 20px; border-radius:10px; font-size:14px; font-weight:600; z-index:999; box-shadow:0 4px 16px rgba(0,0,0,.12); animation:slideUp .25s ease; }
        .plan-toast.ok{ background:#ecfdf5; color:#178a4a; border:1px solid #a7f3d0; }
        .plan-toast.err{ background:#fef2f2; color:#b91c1c; border:1px solid #fca5a5; }
        @keyframes slideUp{ from{ opacity:0; transform:translateY(12px); } to{ opacity:1; transform:translateY(0); } }
        .pc-course-row{ display:flex; align-items:center; gap:10px; padding:10px 12px; border:1px solid var(--line); border-radius:8px; margin-bottom:6px; background:#fff; }
        .pc-course-row .pc-title{ flex:1; font-size:13.5px; }
        .pc-course-row .badge{ flex-shrink:0; }
        .pc-empty{ text-align:center; padding:24px 14px; color:var(--muted); font-size:13.5px; }
        .pc-search{ display:flex; align-items:center; gap:8px; border:1px solid var(--line); border-radius:8px; padding:7px 10px; background:#fff; margin-bottom:12px; }
        .pc-search input{ border:0; outline:0; flex:1; font:inherit; font-size:13.5px; min-width:0; }
        .pc-avail{ max-height:240px; overflow-y:auto; border:1px solid var(--line); border-radius:8px; }
        .pc-avail-item{ display:flex; align-items:center; justify-content:space-between; padding:8px 12px; border-bottom:1px solid var(--line); font-size:13.5px; }
        .pc-avail-item:last-child{ border-bottom:none; }
        .pc-avail-item:hover{ background:var(--surface-2); }
        .billing-checks{ display:flex; gap:18px; }
        @media(max-width:860px){ .plan-grid{ grid-template-columns:1fr; } .plan-editor{ position:static; } }
      `}</style>

      <div className="content wide plan-admin">
        <h1>Gerenciar Planos</h1>
        <p className="sub">
          Configure todos os detalhes dos planos de assinatura diretamente no banco de dados.
        </p>

        <div className="plan-grid">
          {/* ---- Sidebar: Plan List ---- */}
          <section className="plan-list">
            {plans.map((plan) => (
              <button
                key={plan.id}
                type="button"
                className={`plan-item${selectedId === plan.id ? ' sel' : ''}`}
                onClick={() => selectPlan(plan.id)}
                style={{ width: '100%', textAlign: 'left' }}
              >
                <div
                  className="plan-dot"
                  style={{
                    background: plan.is_active ? 'var(--green, #22c55e)' : 'var(--muted)',
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3>{plan.name}</h3>
                  <div className="plan-sub">{plan.audience || plan.id}</div>
                </div>
                <div className="plan-right">
                  <div className="plan-price">
                    {plan.price_monthly > 0 ? formatR(plan.price_monthly) : 'Sob consulta'}
                  </div>
                  <div className="plan-status">
                    {plan.is_active ? (
                      <span style={{ color: 'var(--green, #22c55e)' }}>Ativo</span>
                    ) : (
                      <span className="muted">Inativo</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </section>

          {/* ---- Editor ---- */}
          <aside className="plan-editor">
            <div className="card card-pad">
              {merged ? (
                <>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '14px',
                    }}
                  >
                    <div>
                      <h2 style={{ fontSize: '20px', margin: '0 0 4px' }}>{merged.name}</h2>
                      <span className="muted" style={{ fontSize: '12.5px' }}>
                        ID: {merged.id} | Atualizado: {formatDate(merged.updated_at)}
                      </span>
                    </div>
                    {hasDraftChanges && (
                      <span
                        className="badge"
                        style={{
                          background: '#fef3c7',
                          color: '#92400e',
                          fontSize: '11px',
                        }}
                      >
                        Alteracoes pendentes
                      </span>
                    )}
                  </div>

                  {/* Tabs */}
                  <div className="plan-tabs">
                    <button
                      type="button"
                      className={`plan-tab${activeTab === 'conteudo' ? ' active' : ''}`}
                      onClick={() => setActiveTab('conteudo')}
                    >
                      Conteudo
                    </button>
                    <button
                      type="button"
                      className={`plan-tab${activeTab === 'precos' ? ' active' : ''}`}
                      onClick={() => setActiveTab('precos')}
                    >
                      Precos
                    </button>
                    <button
                      type="button"
                      className={`plan-tab${activeTab === 'cursos' ? ' active' : ''}`}
                      onClick={() => openCoursesTab()}
                    >
                      Cursos
                    </button>
                  </div>

                  {/* ---- Tab: Conteudo ---- */}
                  {activeTab === 'conteudo' && (
                    <div>
                      <div className="plan-field">
                        <label>Nome do plano</label>
                        <input
                          type="text"
                          value={(draft.name ?? merged.name) as string}
                          onChange={(e) => updateDraft('name', e.target.value)}
                        />
                      </div>

                      <div className="plan-field">
                        <label>Badge CSS</label>
                        <input
                          type="text"
                          value={(draft.badge ?? merged.badge) as string}
                          onChange={(e) => updateDraft('badge', e.target.value)}
                          placeholder="ex: plan-prata"
                        />
                      </div>

                      <div className="plan-field">
                        <label>Publico-alvo</label>
                        <input
                          type="text"
                          value={(draft.audience ?? merged.audience) as string}
                          onChange={(e) => updateDraft('audience', e.target.value)}
                        />
                      </div>

                      <div className="plan-field">
                        <label>Descricao</label>
                        <textarea
                          value={(draft.description ?? merged.description) as string}
                          onChange={(e) => updateDraft('description', e.target.value)}
                        />
                      </div>

                      <div className="plan-row">
                        <div className="plan-field">
                          <label>Nivel hierarquico</label>
                          <input
                            type="number"
                            min={0}
                            value={(draft.hierarchy_level ?? merged.hierarchy_level) as number}
                            onChange={(e) =>
                              updateDraft('hierarchy_level', parseInt(e.target.value) || 0)
                            }
                          />
                        </div>
                        <div className="plan-field">
                          <label>Ordem (sort)</label>
                          <input
                            type="number"
                            min={0}
                            value={(draft.sort_order ?? merged.sort_order) as number}
                            onChange={(e) =>
                              updateDraft('sort_order', parseInt(e.target.value) || 0)
                            }
                            disabled
                          />
                        </div>
                      </div>

                      <label className="plan-check" htmlFor="chk-featured">
                        <input
                          type="checkbox"
                          id="chk-featured"
                          checked={(draft.is_featured ?? merged.is_featured) as boolean}
                          onChange={(e) => updateDraft('is_featured', e.target.checked)}
                        />
                        <span>Plano em destaque (featured)</span>
                      </label>

                      <label className="plan-check" htmlFor="chk-active">
                        <input
                          type="checkbox"
                          id="chk-active"
                          checked={(draft.is_active ?? merged.is_active) as boolean}
                          onChange={(e) => updateDraft('is_active', e.target.checked)}
                        />
                        <span>Plano ativo (visivel na plataforma)</span>
                      </label>

                      {/* Features */}
                      <div className="plan-field">
                        <label>Beneficios ({currentFeatures().length})</label>
                        <ul className="feat-list">
                          {currentFeatures().map((feat, idx) => (
                            <li key={idx} className="feat-item">
                              <span className="feat-text">{feat}</span>
                              <button
                                type="button"
                                title="Mover para cima"
                                onClick={() => moveFeature(idx, -1)}
                                disabled={idx === 0}
                              >
                                &#9650;
                              </button>
                              <button
                                type="button"
                                title="Mover para baixo"
                                onClick={() => moveFeature(idx, 1)}
                                disabled={idx === currentFeatures().length - 1}
                              >
                                &#9660;
                              </button>
                              <button
                                type="button"
                                title="Remover"
                                onClick={() => removeFeature(idx)}
                                style={{ color: '#b91c1c' }}
                              >
                                &#10005;
                              </button>
                            </li>
                          ))}
                        </ul>
                        <div className="feat-add">
                          <input
                            type="text"
                            value={newFeature}
                            onChange={(e) => setNewFeature(e.target.value)}
                            placeholder="Novo beneficio..."
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                addFeature()
                              }
                            }}
                            style={{
                              border: '1px solid var(--line)',
                              borderRadius: '8px',
                              padding: '8px 10px',
                              font: 'inherit',
                              fontSize: '14px',
                            }}
                          />
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={addFeature}
                          >
                            Adicionar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ---- Tab: Precos ---- */}
                  {activeTab === 'precos' && (
                    <div>
                      <div className="plan-row">
                        <div className="plan-field">
                          <label>Preco mensal (R$)</label>
                          <input
                            type="text"
                            value={
                              draft.price_monthly !== undefined
                                ? String((draft.price_monthly as number) / 100)
                                : merged.price_monthly > 0
                                  ? String(merged.price_monthly / 100)
                                  : '0'
                            }
                            onChange={(e) => {
                              const val = parseFloat(e.target.value.replace(',', '.')) || 0
                              updateDraft('price_monthly', Math.round(val * 100))
                            }}
                            placeholder="0,00"
                          />
                          <span
                            className="muted"
                            style={{
                              fontSize: '12px',
                              marginTop: '4px',
                              display: 'block',
                            }}
                          >
                            Atual: {formatR(merged.price_monthly)}
                          </span>
                        </div>
                        <div className="plan-field">
                          <label>Preco anual (R$)</label>
                          <input
                            type="text"
                            value={
                              draft.price_annual !== undefined
                                ? String((draft.price_annual as number) / 100)
                                : merged.price_annual > 0
                                  ? String(merged.price_annual / 100)
                                  : '0'
                            }
                            onChange={(e) => {
                              const val = parseFloat(e.target.value.replace(',', '.')) || 0
                              updateDraft('price_annual', Math.round(val * 100))
                            }}
                            placeholder="0,00"
                          />
                          <span
                            className="muted"
                            style={{
                              fontSize: '12px',
                              marginTop: '4px',
                              display: 'block',
                            }}
                          >
                            Atual: {formatR(merged.price_annual)}
                          </span>
                        </div>
                      </div>

                      <div className="plan-field">
                        <label>Opcoes de cobranca</label>
                        <div className="billing-checks">
                          <label className="plan-check">
                            <input
                              type="checkbox"
                              checked={(
                                (draft.billing_options ?? merged.billing_options) as string[]
                              ).includes('monthly')}
                              onChange={(e) => {
                                const current = [
                                  ...((draft.billing_options ??
                                    merged.billing_options) as string[]),
                                ]
                                if (e.target.checked) {
                                  if (!current.includes('monthly')) current.push('monthly')
                                } else {
                                  const idx = current.indexOf('monthly')
                                  if (idx >= 0) current.splice(idx, 1)
                                }
                                updateDraft('billing_options', current)
                              }}
                            />
                            <span>Mensal</span>
                          </label>
                          <label className="plan-check">
                            <input
                              type="checkbox"
                              checked={(
                                (draft.billing_options ?? merged.billing_options) as string[]
                              ).includes('annual')}
                              onChange={(e) => {
                                const current = [
                                  ...((draft.billing_options ??
                                    merged.billing_options) as string[]),
                                ]
                                if (e.target.checked) {
                                  if (!current.includes('annual')) current.push('annual')
                                } else {
                                  const idx = current.indexOf('annual')
                                  if (idx >= 0) current.splice(idx, 1)
                                }
                                updateDraft('billing_options', current)
                              }}
                            />
                            <span>Anual</span>
                          </label>
                        </div>
                      </div>

                      <div
                        className="card"
                        style={{
                          padding: '14px',
                          background: 'var(--blue-50, #eff6ff)',
                          marginTop: '8px',
                        }}
                      >
                        <p
                          style={{
                            fontSize: '13px',
                            color: 'var(--ink-2)',
                            margin: 0,
                          }}
                        >
                          <strong>Nota:</strong> Os precos sao armazenados em centavos no banco.
                          Digite o valor em reais (ex: 197.00) e o sistema converte automaticamente.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ---- Tab: Cursos ---- */}
                  {activeTab === 'cursos' && (
                    <div>
                      <label className="plan-check" htmlFor="chk-all-courses">
                        <input
                          type="checkbox"
                          id="chk-all-courses"
                          checked={
                            (draft.includes_all_courses ?? merged.includes_all_courses) as boolean
                          }
                          onChange={(e) => updateDraft('includes_all_courses', e.target.checked)}
                        />
                        <span>Incluir todos os cursos publicados</span>
                      </label>

                      {!((draft.includes_all_courses ?? merged.includes_all_courses) as boolean) ? (
                        <>
                          <div className="plan-field">
                            <label>Cursos incluidos neste plano ({planCourses.length})</label>
                            {loadingCourses ? (
                              <div className="pc-empty">Carregando...</div>
                            ) : planCourses.length === 0 ? (
                              <div className="pc-empty">
                                Nenhum curso selecionado. Adicione cursos abaixo.
                              </div>
                            ) : (
                              planCourses.map((pc) => (
                                <div key={pc.course_id} className="pc-course-row">
                                  <span className="pc-title">
                                    {pc.courses?.title ?? pc.course_id}
                                  </span>
                                  {pc.courses?.published ? (
                                    <span className="badge green dot">Pub</span>
                                  ) : (
                                    <span className="badge">Rascunho</span>
                                  )}
                                  <button
                                    type="button"
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => removeCourseFromPlan(pc.course_id)}
                                    style={{
                                      color: '#b91c1c',
                                      fontSize: '12px',
                                    }}
                                  >
                                    Remover
                                  </button>
                                </div>
                              ))
                            )}
                          </div>

                          <div className="plan-field">
                            <label>Adicionar curso ao plano</label>
                            <div className="pc-search">
                              <span className="muted" aria-hidden="true">
                                &#8981;
                              </span>
                              <input
                                value={courseSearch}
                                onChange={(e) => setCourseSearch(e.target.value)}
                                placeholder="Buscar curso por titulo..."
                              />
                            </div>
                            <div className="pc-avail">
                              {availableCourses.length === 0 ? (
                                <div className="pc-empty">Nenhum curso disponivel.</div>
                              ) : (
                                availableCourses.slice(0, 20).map((c) => (
                                  <div key={c.id} className="pc-avail-item">
                                    <span>
                                      {c.title}
                                      {!c.published && (
                                        <span
                                          className="muted"
                                          style={{
                                            fontSize: '11px',
                                            marginLeft: '6px',
                                          }}
                                        >
                                          (rascunho)
                                        </span>
                                      )}
                                    </span>
                                    <button
                                      type="button"
                                      className="btn btn-primary btn-sm"
                                      onClick={() => addCourseToplan(c.id)}
                                      style={{
                                        fontSize: '12px',
                                        padding: '4px 10px',
                                      }}
                                    >
                                      Adicionar
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div
                          className="card"
                          style={{
                            padding: '14px',
                            background: 'var(--green-tint, #ecfdf5)',
                          }}
                        >
                          <p
                            style={{
                              fontSize: '13.5px',
                              color: '#178a4a',
                              margin: 0,
                            }}
                          >
                            Este plano da acesso a <strong>todos os cursos publicados</strong> da
                            plataforma automaticamente. Nao e necessario selecionar cursos
                            individuais.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ---- Actions ---- */}
                  <div className="plan-actions">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={save}
                      disabled={saving || !hasDraftChanges}
                    >
                      {saving ? 'Salvando...' : 'Salvar alteracoes'}
                    </button>
                    {hasDraftChanges && (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => setDraft({})}
                        disabled={saving}
                      >
                        Descartar
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="pc-empty">Selecione um plano na lista para editar.</div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Toast */}
      {toast && <div className={`plan-toast ${toast.ok ? 'ok' : 'err'}`}>{toast.text}</div>}
    </>
  )
}
