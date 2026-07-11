'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, GraduationCap, Loader2, Plus, Trash2 } from 'lucide-react'

interface Enrollment {
  id: string
  courseId: string
  courseTitle: string
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
interface Profile {
  user: {
    id: string
    name: string
    email: string
    plan: string | null
    createdAt: string
    lastSignIn: string | null
  }
  enrollments: Enrollment[]
  moduleProgress: Record<string, ModuleProgress[]>
  certificates: number
  avgProgress: number
}

const PLANS = ['free', 'prata', 'ouro', 'diamante', 'macroempresa']
const PLAN_CLASS: Record<string, string> = {
  free: 'plan-free',
  prata: 'plan-prata',
  ouro: 'plan-ouro',
  diamante: 'plan-diamante',
  macroempresa: 'plan-diamante',
}

function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso))
}

export function AdminStudentDetail({
  userId,
  courseOptions,
}: {
  userId: string
  courseOptions: Array<{ id: string; title: string }>
}) {
  const router = useRouter()
  const [data, setData] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [enrollCourse, setEnrollCourse] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/users/${userId}/profile`)
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.error ?? 'Erro ao carregar aluno')
      setData(payload as Profile)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar aluno')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void load()
  }, [load])

  const enrolledIds = useMemo(
    () => new Set((data?.enrollments ?? []).map((e) => e.courseId)),
    [data]
  )
  const availableCourses = courseOptions.filter((c) => !enrolledIds.has(c.id))

  async function changePlan(plan: string) {
    setBusy(true)
    setMsg('')
    try {
      const res = await fetch(`/api/admin/users/${userId}/plan`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Falha ao trocar plano')
      setMsg('Plano atualizado.')
      await load()
      router.refresh()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Falha ao trocar plano')
    } finally {
      setBusy(false)
    }
  }

  async function enroll() {
    if (!enrollCourse) return
    setBusy(true)
    setMsg('')
    try {
      const res = await fetch('/api/admin/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, courseId: enrollCourse }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Falha ao matricular')
      setMsg('Aluno matriculado com sucesso.')
      setEnrollCourse('')
      await load()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Falha ao matricular')
    } finally {
      setBusy(false)
    }
  }

  async function unenroll(enrollmentId: string, courseTitle: string) {
    if (!window.confirm(`Desmatricular o aluno de "${courseTitle}"?`)) return
    setBusy(true)
    setMsg('')
    try {
      const res = await fetch(`/api/admin/enrollments/${enrollmentId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Falha ao desmatricular')
      setMsg('Matrícula removida.')
      await load()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Falha ao desmatricular')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex aic" style={{ gap: 10, padding: 40, justifyContent: 'center' }}>
        <Loader2 className="spin" size={18} /> <span className="muted">Carregando aluno…</span>
      </div>
    )
  }
  if (error || !data) {
    return (
      <p className="muted" style={{ padding: 24 }}>
        {error ?? 'Aluno não encontrado.'}
      </p>
    )
  }

  const u = data.user
  const plan = (u.plan ?? 'free').toLowerCase()

  return (
    <>
      <style>{`
        .sd-head{ display:flex; gap:16px; align-items:center; flex-wrap:wrap; }
        .sd-av{ width:56px; height:56px; border-radius:50%; background:var(--ink,#0f172a); color:#fff; display:grid; place-items:center; font-weight:700; font-size:19px; flex:none; }
        .sd-stats{ display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-top:18px; }
        .sd-stat{ background:#f8fafc; border:1px solid var(--line,#e5e7eb); border-radius:10px; padding:14px 16px; }
        .sd-stat b{ font-size:22px; display:block; letter-spacing:-.02em; }
        .sd-stat span{ font-size:12px; color:var(--muted,#64748b); }
        .sd-course{ border:1px solid var(--line,#e5e7eb); border-radius:12px; padding:16px; margin-bottom:12px; }
        .sd-bar{ height:8px; background:#eef0f3; border-radius:999px; overflow:hidden; margin:8px 0 4px; }
        .sd-bar span{ display:block; height:100%; background:linear-gradient(90deg,#4f46e5,#7bbcff); }
        .sd-mod{ display:flex; justify-content:space-between; font-size:13px; padding:6px 0; border-top:1px dashed var(--line,#eef0f3); }
        .sd-enroll{ display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
        .sd-select{ padding:9px 12px; border-radius:8px; border:1px solid var(--line-2,#d1d5db); font-size:14px; font-family:inherit; min-width:240px; }
      `}</style>

      {/* Header + plano */}
      <div className="card card-pad">
        <div className="sd-head">
          <div className="sd-av">{initials(u.name)}</div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ fontSize: 22, marginBottom: 2 }}>{u.name}</h1>
            <p className="muted" style={{ fontSize: 13 }}>
              {u.email}
            </p>
            <p className="muted" style={{ fontSize: 12, marginTop: 2 }}>
              Membro desde {fmtDate(u.createdAt)} · Último acesso {fmtDate(u.lastSignIn)}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label className="muted" style={{ fontSize: 12 }}>
              Plano
            </label>
            <div className="flex aic" style={{ gap: 8 }}>
              <span className={`plan-badge ${PLAN_CLASS[plan] ?? 'plan-free'}`}>
                {plan.toUpperCase()}
              </span>
              <select
                className="sd-select"
                style={{ minWidth: 140 }}
                value={plan}
                disabled={busy}
                onChange={(e) => void changePlan(e.target.value)}
              >
                {PLANS.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="sd-stats">
          <div className="sd-stat">
            <b>{data.enrollments.length}</b>
            <span>Matrículas</span>
          </div>
          <div className="sd-stat">
            <b>{data.avgProgress}%</b>
            <span>Progresso médio</span>
          </div>
          <div className="sd-stat">
            <b>{data.certificates}</b>
            <span>Certificados</span>
          </div>
        </div>
      </div>

      {/* Matricular em curso */}
      <div className="card card-pad" style={{ marginTop: 16 }}>
        <h2
          style={{ fontSize: 16, marginBottom: 10, display: 'flex', gap: 8, alignItems: 'center' }}
        >
          <GraduationCap size={18} /> Matricular em um curso
        </h2>
        <div className="sd-enroll">
          <select
            className="sd-select"
            value={enrollCourse}
            disabled={busy || availableCourses.length === 0}
            onChange={(e) => setEnrollCourse(e.target.value)}
          >
            <option value="">
              {availableCourses.length ? 'Selecione o curso…' : 'Já matriculado em todos os cursos'}
            </option>
            {availableCourses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          <button
            className="btn btn-primary btn-sm"
            disabled={busy || !enrollCourse}
            onClick={() => void enroll()}
          >
            <Plus size={16} /> Matricular
          </button>
        </div>
        {msg && (
          <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>
            {msg}
          </p>
        )}
      </div>

      {/* Cursos + progresso */}
      <div className="card card-pad" style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Cursos matriculados & progresso</h2>
        {data.enrollments.length === 0 && (
          <p className="muted" style={{ fontSize: 14 }}>
            Este aluno ainda não está matriculado em nenhum curso.
          </p>
        )}
        {data.enrollments.map((e) => {
          const mods = data.moduleProgress[e.courseId] ?? []
          const open = expanded === e.courseId
          return (
            <div key={e.id} className="sd-course">
              <div className="flex between aic" style={{ gap: 10, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <strong style={{ fontSize: 15 }}>{e.courseTitle}</strong>
                  <div className="sd-bar">
                    <span style={{ width: `${e.progress}%` }} />
                  </div>
                  <span className="muted" style={{ fontSize: 12 }}>
                    {e.progress}% · {e.completedLessons}/{e.totalLessons} aulas · {e.status} · desde{' '}
                    {fmtDate(e.enrolledAt)}
                  </span>
                </div>
                <div className="flex aic" style={{ gap: 8 }}>
                  {mods.length > 0 && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setExpanded(open ? null : e.courseId)}
                    >
                      Módulos{' '}
                      <ChevronDown
                        size={14}
                        style={{ transform: open ? 'rotate(180deg)' : 'none' }}
                      />
                    </button>
                  )}
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={busy}
                    onClick={() => void unenroll(e.id, e.courseTitle)}
                  >
                    <Trash2 size={14} /> Desmatricular
                  </button>
                </div>
              </div>
              {open &&
                mods.map((m) => (
                  <div key={m.order} className="sd-mod">
                    <span>{m.title}</span>
                    <span className="muted">
                      {m.completed}/{m.total}
                    </span>
                  </div>
                ))}
            </div>
          )
        })}
      </div>
    </>
  )
}
