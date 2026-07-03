'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

export interface ModalUser {
  id: string
  name: string
  email: string
  plan: string | null
  created_at: string
  enrollmentCount: number
  certificateCount: number
  revenue: number
}

interface EnrollmentEntry {
  id: string
  courseId: string
  courseTitle: string
  courseThumbnail: string | null
  status: string
  enrolledAt: string
  progress: number
  completedLessons: number
  totalLessons: number
}

interface ModuleProgress {
  title: string
  completed: number
  total: number
  order: number
}

interface ProfileData {
  user: {
    id: string
    name: string
    email: string
    plan: string | null
    createdAt: string
    lastSignIn: string | null
  }
  enrollments: EnrollmentEntry[]
  moduleProgress: Record<string, ModuleProgress[]>
  certificates: number
  avgProgress: number
}

interface AdminAlunoModalProps {
  user: ModalUser | null
  courseOptions: Array<{ id: string; title: string }>
  onClose: () => void
  onPlanChanged?: (userId: string, newPlan: string) => void
}

type Tab = 'geral' | 'matriculas' | 'progresso'

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  prata: 'Prata',
  ouro: 'Ouro',
  diamante: 'Diamante',
}
const PLAN_CLASSES: Record<string, string> = {
  free: 'plan-free',
  prata: 'plan-prata',
  ouro: 'plan-ouro',
  diamante: 'plan-diamante',
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso))
}
function formatRelative(iso: string | null) {
  if (!iso) return 'Nunca'
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Hoje'
  if (days === 1) return 'Ontem'
  if (days < 30) return `${days} dias atrás`
  return formatDate(iso)
}
function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function AdminAlunoModal({
  user,
  courseOptions,
  onClose,
  onPlanChanged,
}: AdminAlunoModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null)
  const [tab, setTab] = useState<Tab>('geral')
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Alterar plano
  const [editingPlan, setEditingPlan] = useState(false)
  const [newPlan, setNewPlan] = useState(user?.plan ?? 'free')
  const [savingPlan, setSavingPlan] = useState(false)
  const [planMsg, setPlanMsg] = useState('')

  // Matricular em curso
  const [addEnrollCourseId, setAddEnrollCourseId] = useState('')
  const [addingEnroll, setAddingEnroll] = useState(false)
  const [addEnrollMsg, setAddEnrollMsg] = useState('')

  // Remover matrícula
  const [removingId, setRemovingId] = useState<string | null>(null)

  const loadProfile = useCallback(async (userId: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/users/${userId}/profile`)
      const data = (await res.json()) as ProfileData & { error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Erro ao carregar perfil')
      } else {
        setProfile(data)
      }
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) {
      setTab('geral')
      setProfile(null)
      setEditingPlan(false)
      setNewPlan(user.plan ?? 'free')
      setPlanMsg('')
      setAddEnrollMsg('')
      setAddEnrollCourseId('')
      void loadProfile(user.id)
    }
  }, [user, loadProfile])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  async function handleSavePlan() {
    if (!user) return
    setSavingPlan(true)
    setPlanMsg('')
    try {
      const res = await fetch(`/api/admin/users/${user.id}/plan`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: newPlan }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string; plan?: string }
      if (!res.ok) {
        setPlanMsg(`Erro: ${data.error ?? 'falha'}`)
      } else {
        setPlanMsg('Plano atualizado!')
        setEditingPlan(false)
        onPlanChanged?.(user.id, newPlan)
      }
    } catch {
      setPlanMsg('Erro de conexão.')
    } finally {
      setSavingPlan(false)
    }
  }

  async function handleAddEnroll() {
    if (!user || !addEnrollCourseId) return
    setAddingEnroll(true)
    setAddEnrollMsg('')
    try {
      const res = await fetch('/api/admin/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, courseId: addEnrollCourseId }),
      })
      const data = (await res.json()) as { error?: string; already_exists?: boolean }
      if (!res.ok) {
        setAddEnrollMsg(`Erro: ${data.error ?? 'falha'}`)
      } else if (data.already_exists) {
        setAddEnrollMsg('Aluno já está matriculado neste curso.')
      } else {
        setAddEnrollMsg('Matriculado!')
        setAddEnrollCourseId('')
        void loadProfile(user.id)
      }
    } catch {
      setAddEnrollMsg('Erro de conexão.')
    } finally {
      setAddingEnroll(false)
    }
  }

  async function handleRemoveEnroll(enrollmentId: string) {
    if (!window.confirm('Remover esta matrícula?')) return
    setRemovingId(enrollmentId)
    try {
      const res = await fetch(`/api/admin/enrollments/${enrollmentId}`, { method: 'DELETE' })
      if (res.ok && profile) {
        setProfile({
          ...profile,
          enrollments: profile.enrollments.filter((e) => e.id !== enrollmentId),
        })
      }
    } catch {
      // silently fail
    } finally {
      setRemovingId(null)
    }
  }

  if (!user) return null

  const plan = (user.plan ?? 'free').toLowerCase()
  const availableCourses = courseOptions.filter(
    (c) => !profile?.enrollments.some((e) => e.courseId === c.id)
  )

  return (
    <div
      ref={backdropRef}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.45)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 50,
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose()
      }}
    >
      <style>{`
        .modal-tabs{ display:flex; gap:2px; background:var(--surface-2); border-radius:10px; padding:4px; }
        .modal-tab{ flex:1; padding:7px 4px; border-radius:8px; border:none; background:transparent; font-size:12.5px; font-weight:600; color:var(--muted); cursor:pointer; text-align:center; }
        .modal-tab.active{ background:#fff; color:var(--blue); box-shadow:0 1px 3px rgba(0,0,0,.1); }
        .enroll-card{ display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid var(--line); }
        .enroll-card:last-child{ border-bottom:none; }
        .prog-thin{ flex:1; height:4px; background:#eef0f3; border-radius:999px; overflow:hidden; }
        .prog-thin span{ display:block; height:100%; background:var(--blue); }
        .mod-row{ padding:8px 0; border-bottom:1px solid var(--line); }
        .mod-row:last-child{ border-bottom:none; }
        .mod-prog{ height:5px; background:#eef0f3; border-radius:999px; overflow:hidden; margin-top:5px; }
        .mod-prog span{ display:block; height:100%; background:var(--blue); }
      `}</style>

      <div
        style={{
          background: '#fff',
          borderRadius: 'var(--r-lg)',
          width: '100%',
          maxWidth: '600px',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            display: 'flex',
            gap: '14px',
            alignItems: 'center',
            borderBottom: '1px solid var(--line)',
            flexShrink: 0,
          }}
        >
          <div className="avatar lg">{initials(user.name)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              style={{
                fontSize: '18px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user.name}
            </h3>
            <p className="muted" style={{ fontSize: '13px' }}>
              {user.email}
            </p>
            <div
              style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                marginTop: '5px',
                flexWrap: 'wrap',
              }}
            >
              <span
                className={`plan-badge ${PLAN_CLASSES[plan] ?? 'plan-free'}`}
                style={{ padding: '2px 10px' }}
              >
                {PLAN_LABELS[plan] ?? user.plan ?? 'Free'}
              </span>
              <span className="muted" style={{ fontSize: '12px' }}>
                desde {formatDate(user.created_at)}
              </span>
              {profile && (
                <span className="muted" style={{ fontSize: '12px' }}>
                  acesso: {formatRelative(profile.user.lastSignIn)}
                </span>
              )}
            </div>
          </div>
          <button
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: '1px solid var(--line-2)',
              background: '#fff',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--muted)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            onClick={onClose}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Abas */}
        <div style={{ padding: '14px 24px 0', flexShrink: 0 }}>
          <div className="modal-tabs">
            <button
              className={`modal-tab${tab === 'geral' ? ' active' : ''}`}
              onClick={() => setTab('geral')}
            >
              Visão Geral
            </button>
            <button
              className={`modal-tab${tab === 'matriculas' ? ' active' : ''}`}
              onClick={() => setTab('matriculas')}
            >
              Matrículas {profile ? `(${profile.enrollments.length})` : ''}
            </button>
            <button
              className={`modal-tab${tab === 'progresso' ? ' active' : ''}`}
              onClick={() => setTab('progresso')}
            >
              Progresso
            </button>
          </div>
        </div>

        {/* Conteúdo das abas */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px 20px' }}>
          {loading && (
            <p
              className="muted"
              style={{ textAlign: 'center', padding: '30px 0', fontSize: '14px' }}
            >
              Carregando...
            </p>
          )}
          {error && (
            <p
              style={{ color: '#e53e3e', textAlign: 'center', padding: '30px 0', fontSize: '14px' }}
            >
              {error}
            </p>
          )}

          {!loading && !error && profile && tab === 'geral' && (
            <>
              {/* Stats */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '10px',
                  marginBottom: '18px',
                }}
              >
                {[
                  { n: profile.enrollments.length, l: 'Matrículas' },
                  { n: `${profile.avgProgress}%`, l: 'Progresso médio' },
                  { n: profile.certificates, l: 'Certificados' },
                ].map((s) => (
                  <div
                    key={s.l}
                    style={{
                      background: 'var(--surface-2)',
                      borderRadius: 'var(--r)',
                      padding: '12px 14px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '22px', fontWeight: 700 }}>{s.n}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '2px' }}>
                      {s.l}
                    </div>
                  </div>
                ))}
              </div>

              {/* Plano */}
              <div
                style={{
                  borderRadius: 'var(--r)',
                  border: '1px solid var(--line)',
                  padding: '14px 16px',
                }}
              >
                <div className="flex between aic">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>Plano atual</div>
                    <span
                      className={`plan-badge ${PLAN_CLASSES[plan] ?? 'plan-free'}`}
                      style={{ marginTop: '4px', padding: '2px 10px', display: 'inline-block' }}
                    >
                      {PLAN_LABELS[plan] ?? 'Free'}
                    </span>
                  </div>
                  {!editingPlan && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setEditingPlan(true)
                        setNewPlan(user.plan ?? 'free')
                      }}
                    >
                      Alterar
                    </button>
                  )}
                </div>
                {editingPlan && (
                  <div
                    style={{
                      marginTop: '12px',
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                    }}
                  >
                    <select
                      className="input"
                      style={{ flex: 1, minWidth: '140px' }}
                      value={newPlan}
                      onChange={(e) => setNewPlan(e.target.value)}
                    >
                      <option value="free">Free</option>
                      <option value="prata">Prata</option>
                      <option value="ouro">Ouro</option>
                      <option value="diamante">Diamante</option>
                    </select>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        void handleSavePlan()
                      }}
                      disabled={savingPlan}
                    >
                      {savingPlan ? 'Salvando...' : 'Confirmar'}
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setEditingPlan(false)
                        setPlanMsg('')
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                )}
                {planMsg && (
                  <p
                    style={{
                      fontSize: '12.5px',
                      marginTop: '8px',
                      color: planMsg.startsWith('Erro') ? '#e53e3e' : '#178a4a',
                    }}
                  >
                    {planMsg}
                  </p>
                )}
              </div>
            </>
          )}

          {!loading && !error && profile && tab === 'matriculas' && (
            <>
              {/* Adicionar matrícula */}
              {availableCourses.length > 0 && (
                <div
                  style={{
                    background: 'var(--surface-2)',
                    borderRadius: 'var(--r)',
                    padding: '12px 14px',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                    Matricular em curso
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <select
                      className="input"
                      style={{ flex: 1, minWidth: '160px', fontSize: '13px' }}
                      value={addEnrollCourseId}
                      onChange={(e) => setAddEnrollCourseId(e.target.value)}
                    >
                      <option value="">Selecionar curso...</option>
                      {availableCourses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        void handleAddEnroll()
                      }}
                      disabled={addingEnroll || !addEnrollCourseId}
                    >
                      {addingEnroll ? '...' : '+ Matricular'}
                    </button>
                  </div>
                  {addEnrollMsg && (
                    <p
                      style={{
                        fontSize: '12px',
                        marginTop: '6px',
                        color: addEnrollMsg.startsWith('Erro') ? '#e53e3e' : '#178a4a',
                      }}
                    >
                      {addEnrollMsg}
                    </p>
                  )}
                </div>
              )}

              {/* Lista de matrículas */}
              {profile.enrollments.length === 0 && (
                <p
                  className="muted"
                  style={{ textAlign: 'center', padding: '24px 0', fontSize: '14px' }}
                >
                  Nenhuma matrícula
                </p>
              )}
              {profile.enrollments.map((e) => (
                <div key={e.id} className="enroll-card">
                  <div
                    style={{
                      width: '40px',
                      height: '26px',
                      background: 'linear-gradient(135deg,var(--ink),#3a3f4b)',
                      borderRadius: '6px',
                      flexShrink: 0,
                      overflow: 'hidden',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {e.courseThumbnail && (
                      <img
                        src={e.courseThumbnail}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: '13.5px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {e.courseTitle}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginTop: '4px',
                      }}
                    >
                      <div className="prog-thin">
                        <span style={{ width: `${e.progress}%` }} />
                      </div>
                      <span style={{ fontSize: '11.5px', fontWeight: 700, flexShrink: 0 }}>
                        {e.progress}%
                      </span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '2px' }}>
                      {e.completedLessons}/{e.totalLessons} aulas · {formatDate(e.enrolledAt)}
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: '4px',
                      flexShrink: 0,
                    }}
                  >
                    {e.status === 'completed' ? (
                      <span className="badge green dot" style={{ fontSize: '11px' }}>
                        Concluído
                      </span>
                    ) : (
                      <span
                        className="badge"
                        style={{ fontSize: '11px', background: '#e8f4ff', color: '#1a6aab' }}
                      >
                        Ativo
                      </span>
                    )}
                    <button
                      style={{
                        fontSize: '11px',
                        color: '#e53e3e',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        void handleRemoveEnroll(e.id)
                      }}
                      disabled={removingId === e.id}
                    >
                      {removingId === e.id ? '...' : 'Remover'}
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}

          {!loading && !error && profile && tab === 'progresso' && (
            <>
              {profile.enrollments.length === 0 && (
                <p
                  className="muted"
                  style={{ textAlign: 'center', padding: '24px 0', fontSize: '14px' }}
                >
                  Nenhuma matrícula
                </p>
              )}
              {profile.enrollments.map((enrollment) => (
                <div key={enrollment.id} style={{ marginBottom: '20px' }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '14px',
                      marginBottom: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                      }}
                    >
                      {enrollment.courseTitle}
                    </span>
                    <span
                      style={{
                        fontSize: '13px',
                        color: 'var(--blue)',
                        fontWeight: 700,
                        flexShrink: 0,
                        marginLeft: '8px',
                      }}
                    >
                      {enrollment.progress}%
                    </span>
                  </div>
                  {(profile.moduleProgress[enrollment.id] ?? []).map((mod) => (
                    <div key={mod.title} className="mod-row">
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '13px',
                        }}
                      >
                        <span className="muted">{mod.title}</span>
                        <span style={{ fontWeight: 600, color: 'var(--ink-2)' }}>
                          {mod.completed}/{mod.total}
                        </span>
                      </div>
                      <div className="mod-prog">
                        <span
                          style={{
                            width:
                              mod.total > 0
                                ? `${Math.round((mod.completed / mod.total) * 100)}%`
                                : '0%',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  {(profile.moduleProgress[enrollment.id] ?? []).length === 0 && (
                    <p className="muted" style={{ fontSize: '12.5px', marginTop: '4px' }}>
                      Sem módulos
                    </p>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
