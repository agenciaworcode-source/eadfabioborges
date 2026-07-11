'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, GraduationCap, Loader2, Plus, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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

const selectCls =
  'h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50'

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
      <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />{' '}
        <span className="text-sm">Carregando aluno…</span>
      </div>
    )
  }
  if (error || !data) {
    return <p className="p-6 text-sm text-muted-foreground">{error ?? 'Aluno não encontrado.'}</p>
  }

  const u = data.user
  const plan = (u.plan ?? 'free').toLowerCase()

  return (
    <div className="flex flex-col gap-4">
      {/* Header + plano */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 pt-6">
          <div className="flex size-14 flex-none items-center justify-center rounded-full bg-foreground text-lg font-bold text-background">
            {initials(u.name)}
          </div>
          <div className="min-w-[200px] flex-1">
            <h1 className="text-xl font-semibold tracking-tight">{u.name}</h1>
            <p className="text-sm text-muted-foreground">{u.email}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Membro desde {fmtDate(u.createdAt)} · Último acesso {fmtDate(u.lastSignIn)}
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Plano</span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="uppercase">
                {plan}
              </Badge>
              <select
                className={selectCls}
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
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { n: data.enrollments.length, l: 'Matrículas' },
          { n: `${data.avgProgress}%`, l: 'Progresso médio' },
          { n: data.certificates, l: 'Certificados' },
        ].map((s) => (
          <Card key={s.l}>
            <CardContent className="pt-6">
              <div className="text-2xl font-semibold tracking-tight">{s.n}</div>
              <div className="text-xs text-muted-foreground">{s.l}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Matricular em curso */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="size-5" /> Matricular em um curso
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <select
            className={`${selectCls} min-w-[260px]`}
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
          <Button size="sm" disabled={busy || !enrollCourse} onClick={() => void enroll()}>
            <Plus className="size-4" /> Matricular
          </Button>
          {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
        </CardContent>
      </Card>

      {/* Cursos + progresso */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cursos matriculados & progresso</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {data.enrollments.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Este aluno ainda não está matriculado em nenhum curso.
            </p>
          )}
          {data.enrollments.map((e) => {
            const mods = data.moduleProgress[e.courseId] ?? []
            const open = expanded === e.courseId
            return (
              <div key={e.id} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-[200px] flex-1">
                    <strong className="text-sm font-semibold">{e.courseTitle}</strong>
                    <div className="my-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div className="h-full bg-primary" style={{ width: `${e.progress}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {e.progress}% · {e.completedLessons}/{e.totalLessons} aulas · {e.status} ·
                      desde {fmtDate(e.enrolledAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {mods.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpanded(open ? null : e.courseId)}
                      >
                        Módulos
                        <ChevronDown
                          className="size-4"
                          style={{ transform: open ? 'rotate(180deg)' : 'none' }}
                        />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() => void unenroll(e.id, e.courseTitle)}
                    >
                      <Trash2 className="size-4" /> Desmatricular
                    </Button>
                  </div>
                </div>
                {open &&
                  mods.map((m) => (
                    <div
                      key={m.order}
                      className="flex justify-between border-t border-dashed py-1.5 text-sm"
                    >
                      <span>{m.title}</span>
                      <span className="text-muted-foreground">
                        {m.completed}/{m.total}
                      </span>
                    </div>
                  ))}
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
