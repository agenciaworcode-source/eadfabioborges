'use client'

import { useState, useCallback, useEffect } from 'react'

interface EnrollmentRow {
  id: string
  userId: string
  userName: string
  userEmail: string
  courseId: string
  courseTitle: string
  status: string
  enrolledAt: string
  progress: number
}

interface CourseOption {
  id: string
  title: string
}

interface AdminMatriculasClientProps {
  courseOptions: CourseOption[]
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso))
}

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
}

function exportToCSV(rows: EnrollmentRow[]) {
  const headers = ['Aluno', 'E-mail', 'Curso', 'Data Matrícula', 'Progresso', 'Status']
  const lines = rows.map((r) => [
    r.userName,
    r.userEmail,
    r.courseTitle,
    formatDate(r.enrolledAt),
    `${r.progress}%`,
    r.status === 'completed' ? 'Concluído' : r.status === 'active' ? 'Ativo' : r.status,
  ])
  const csv = [headers, ...lines].map((row) => row.map((v) => `"${v}"`).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `matriculas-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function AdminMatriculasClient({ courseOptions }: AdminMatriculasClientProps) {
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)

  // Filtros
  const [search, setSearch] = useState('')
  const [courseFilter, setCourseFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [periodFilter, setPeriodFilter] = useState('all')

  // Matrícula manual
  const [showEnrollForm, setShowEnrollForm] = useState(false)
  const [enrollEmail, setEnrollEmail] = useState('')
  const [enrollCourseId, setEnrollCourseId] = useState('')
  const [enrolling, setEnrolling] = useState(false)
  const [enrollMsg, setEnrollMsg] = useState('')

  // Remover
  const [removingId, setRemovingId] = useState<string | null>(null)

  const pageSize = 20

  const fetchEnrollments = useCallback(async (p: number = 0) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(p))
      if (courseFilter) params.set('courseId', courseFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (periodFilter !== 'all') params.set('period', periodFilter)
      if (search) params.set('search', search)

      const res = await fetch(`/api/admin/enrollments?${params.toString()}`)
      const data = await res.json() as { enrollments?: EnrollmentRow[]; total?: number; error?: string }
      if (res.ok) {
        setEnrollments(data.enrollments ?? [])
        setTotal(data.total ?? 0)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [courseFilter, statusFilter, periodFilter, search])

  useEffect(() => {
    setPage(0)
    void fetchEnrollments(0)
  }, [fetchEnrollments])

  async function handleRemove(enrollmentId: string) {
    if (!window.confirm('Remover esta matrícula? O aluno perderá acesso ao curso.')) return
    setRemovingId(enrollmentId)
    try {
      const res = await fetch(`/api/admin/enrollments/${enrollmentId}`, { method: 'DELETE' })
      if (res.ok) {
        setEnrollments((prev) => prev.filter((e) => e.id !== enrollmentId))
        setTotal((t) => t - 1)
      }
    } catch {
      // silently fail
    } finally {
      setRemovingId(null)
    }
  }

  async function handleEnroll(e: React.FormEvent) {
    e.preventDefault()
    if (!enrollEmail || !enrollCourseId) return
    setEnrolling(true)
    setEnrollMsg('')
    try {
      const res = await fetch('/api/admin/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: enrollEmail, courseId: enrollCourseId }),
      })
      const data = await res.json() as { error?: string; already_exists?: boolean }
      if (!res.ok) {
        setEnrollMsg(`Erro: ${data.error ?? 'falha'}`)
      } else if (data.already_exists) {
        setEnrollMsg('Matrícula já existe.')
      } else {
        setEnrollMsg('Matriculado!')
        setEnrollEmail('')
        setEnrollCourseId('')
        void fetchEnrollments(0)
      }
    } catch {
      setEnrollMsg('Erro de conexão.')
    } finally {
      setEnrolling(false)
    }
  }

  function handlePageChange(newPage: number) {
    setPage(newPage)
    void fetchEnrollments(newPage)
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <>
      <style>{`
        .filter-bar{ display:flex; gap:10px; flex-wrap:wrap; margin:20px 0; }
        .filter-bar .input-srch{ flex:1; min-width:200px; display:flex; align-items:center; gap:8px; background:#fff; border:1px solid var(--line-2); border-radius:var(--r); padding:9px 12px; }
        .filter-bar .input-srch input{ border:none; background:transparent; font-size:13.5px; flex:1; outline:none; }
        .sel-f{ padding:10px 12px; border-radius:var(--r); border:1px solid var(--line-2); background:#fff; font-size:13.5px; font-family:inherit; color:var(--ink); }
        .prog-bar-sm{ width:60px; height:5px; background:#eef0f3; border-radius:999px; overflow:hidden; flex:none; }
        .prog-bar-sm span{ display:block; height:100%; background:var(--blue); }
        .enroll-form{ background:var(--surface-2); border-radius:var(--r); padding:16px; margin-bottom:18px; }
      `}</style>

      <div className="topbar">
        <div className="crumb"><a href="/admin">Admin</a> <span>›</span> <b>Matrículas</b></div>
        <div className="avatar sm" style={{ background: 'var(--ink)' }}>FB</div>
      </div>

      <div className="content wide">
        <div className="flex between aic">
          <div>
            <h1 style={{ fontSize: '26px' }}>Matrículas</h1>
            <p className="muted" style={{ marginTop: '5px', fontSize: '14px' }}>
              {loading ? 'Carregando...' : `${total} matrícula${total !== 1 ? 's' : ''} encontrada${total !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-ghost" onClick={() => exportToCSV(enrollments)} disabled={enrollments.length === 0}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
              Exportar CSV
            </button>
            <button className="btn btn-primary" onClick={() => setShowEnrollForm(!showEnrollForm)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
              Matricular aluno
            </button>
          </div>
        </div>

        {showEnrollForm && (
          <div className="enroll-form" style={{ marginTop: '16px' }}>
            <h3 style={{ fontSize: '15px', marginBottom: '12px' }}>Nova matrícula</h3>
            <form onSubmit={(e) => { void handleEnroll(e) }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div className="field">
                  <label>E-mail do aluno</label>
                  <input className="input" type="email" placeholder="aluno@email.com" value={enrollEmail} onChange={(e) => setEnrollEmail(e.target.value)} required />
                </div>
                <div className="field">
                  <label>Curso</label>
                  <select className="input" value={enrollCourseId} onChange={(e) => setEnrollCourseId(e.target.value)} required>
                    <option value="">Selecionar...</option>
                    {courseOptions.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap12 aic">
                <button className="btn btn-primary btn-sm" type="submit" disabled={enrolling}>{enrolling ? 'Matriculando...' : 'Confirmar'}</button>
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => { setShowEnrollForm(false); setEnrollMsg('') }}>Cancelar</button>
                {enrollMsg && <span className={enrollMsg.startsWith('Erro') ? 'muted' : 'blue'} style={{ fontSize: '13px' }}>{enrollMsg}</span>}
              </div>
            </form>
          </div>
        )}

        {/* Filtros */}
        <div className="filter-bar">
          <div className="input-srch">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
            <input placeholder="Buscar aluno..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="sel-f" value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
            <option value="">Todos os cursos</option>
            {courseOptions.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <select className="sel-f" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Todos os status</option>
            <option value="active">Ativo</option>
            <option value="completed">Concluído</option>
            <option value="canceled">Cancelado</option>
          </select>
          <select className="sel-f" value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)}>
            <option value="all">Todo período</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
          </select>
        </div>

        {/* Tabela */}
        <div className="card">
          <table className="tbl">
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Curso</th>
                <th>Data</th>
                <th>Progresso</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="muted" style={{ textAlign: 'center', padding: '30px' }}>Carregando...</td>
                </tr>
              )}
              {!loading && enrollments.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted" style={{ textAlign: 'center', padding: '30px' }}>Nenhuma matrícula encontrada</td>
                </tr>
              )}
              {!loading && enrollments.map((e) => (
                <tr key={e.id}>
                  <td>
                    <div className="flex aic gap10">
                      <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--blue)', display: 'grid', placeItems: 'center', color: '#fff', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                        {initials(e.userName)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{e.userName}</div>
                        <div className="muted" style={{ fontSize: '12px' }}>{e.userEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: '13.5px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.courseTitle}
                  </td>
                  <td className="muted" style={{ fontSize: '13px' }}>{formatDate(e.enrolledAt)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="prog-bar-sm"><span style={{ width: `${e.progress}%` }} /></div>
                      <span style={{ fontSize: '12px', fontWeight: 700 }}>{e.progress}%</span>
                    </div>
                  </td>
                  <td>
                    {e.status === 'completed'
                      ? <span className="badge green dot" style={{ fontSize: '12px' }}>Concluído</span>
                      : e.status === 'active'
                      ? <span className="badge" style={{ fontSize: '12px', background: '#e8f4ff', color: '#1a6aab' }}>Ativo</span>
                      : <span className="badge" style={{ fontSize: '12px', background: '#fdeede', color: '#b5790f' }}>{e.status}</span>
                    }
                  </td>
                  <td>
                    <button
                      style={{ fontSize: '12px', color: '#e53e3e', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
                      onClick={() => { void handleRemove(e.id) }}
                      disabled={removingId === e.id}
                    >
                      {removingId === e.id ? '...' : 'Remover'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {total > pageSize && (
          <div className="flex between aic" style={{ marginTop: '16px' }}>
            <span className="muted" style={{ fontSize: '13px' }}>
              Página {page + 1} de {totalPages} · {total} total
            </span>
            <div className="flex gap8">
              <button className="btn btn-ghost btn-sm" disabled={page === 0} onClick={() => handlePageChange(page - 1)}>Anterior</button>
              <button className="btn btn-ghost btn-sm" disabled={page >= totalPages - 1} onClick={() => handlePageChange(page + 1)}>Próximo</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
