'use client'

import { useState, useMemo } from 'react'
import { AdminAlunoModal, type ModalUser } from './AdminAlunoModal'

export interface AlunoRow {
  id: string
  name: string
  email: string
  plan: string | null
  created_at: string
  enrollmentCount: number
  certificateCount: number
  revenue: number
}

interface AdminAlunosClientProps {
  users: AlunoRow[]
  courseOptions: Array<{ id: string; title: string }>
}

const PLAN_LABELS: Record<string, string> = {
  free: 'Free', prata: 'Prata', ouro: 'Ouro', diamante: 'Diamante',
}
const PLAN_CLASSES: Record<string, string> = {
  free: 'plan-free', prata: 'plan-prata', ouro: 'plan-ouro', diamante: 'plan-diamante',
}

const PAGE_SIZE = 20

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
}

export function AdminAlunosClient({ users: initialUsers, courseOptions }: AdminAlunosClientProps) {
  const [users, setUsers] = useState<AlunoRow[]>(initialUsers)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [enrollFilter, setEnrollFilter] = useState<'all' | 'enrolled' | 'no-enroll'>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'enrollments'>('recent')
  const [page, setPage] = useState(0)
  const [selectedUser, setSelectedUser] = useState<ModalUser | null>(null)

  // Matrícula manual
  const [enrollEmail, setEnrollEmail] = useState('')
  const [enrollCourseId, setEnrollCourseId] = useState('')
  const [enrolling, setEnrolling] = useState(false)
  const [enrollMsg, setEnrollMsg] = useState('')
  const [showEnrollForm, setShowEnrollForm] = useState(false)

  const filtered = useMemo(() => {
    let result = users.filter((u) => {
      const matchSearch =
        !search ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      const matchPlan = planFilter === 'all' || (u.plan ?? 'free').toLowerCase() === planFilter
      const matchEnroll =
        enrollFilter === 'all' ||
        (enrollFilter === 'enrolled' && u.enrollmentCount > 0) ||
        (enrollFilter === 'no-enroll' && u.enrollmentCount === 0)
      return matchSearch && matchPlan && matchEnroll
    })
    if (sortBy === 'name') result = [...result].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    if (sortBy === 'enrollments') result = [...result].sort((a, b) => b.enrollmentCount - a.enrollmentCount)
    return result
  }, [users, search, planFilter, enrollFilter, sortBy])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const handleSearchChange = (v: string) => { setSearch(v); setPage(0) }
  const handlePlanChange = (v: string) => { setPlanFilter(v); setPage(0) }
  const handleEnrollFilterChange = (v: string) => { setEnrollFilter(v as 'all' | 'enrolled' | 'no-enroll'); setPage(0) }
  const handleSortChange = (v: string) => { setSortBy(v as 'recent' | 'name' | 'enrollments'); setPage(0) }

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
      const data = (await res.json()) as { error?: string; already_exists?: boolean }
      if (!res.ok) {
        setEnrollMsg(`Erro: ${data.error ?? 'falha ao matricular'}`)
      } else if (data.already_exists) {
        setEnrollMsg('Matrícula já existe para este aluno e curso.')
      } else {
        setEnrollMsg('Matrícula criada!')
        setEnrollEmail('')
        setEnrollCourseId('')
        // Atualizar contagem do aluno localmente
        setUsers((prev) =>
          prev.map((u) =>
            u.email === enrollEmail ? { ...u, enrollmentCount: u.enrollmentCount + 1 } : u
          )
        )
      }
    } catch {
      setEnrollMsg('Erro de conexão.')
    } finally {
      setEnrolling(false)
    }
  }

  function handlePlanChanged(userId: string, newPlan: string) {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, plan: newPlan } : u))
    setSelectedUser((prev) => prev && prev.id === userId ? { ...prev, plan: newPlan } : prev)
  }

  return (
    <>
      <style>{`
        .toolbar{ display:flex; gap:10px; align-items:center; margin:20px 0; flex-wrap:wrap; }
        .toolbar .input-icn{ flex:1; min-width:220px; }
        .sel{ padding:10px 12px; border-radius:var(--r); border:1px solid var(--line-2); background:#fff; font-size:13.5px; font-family:inherit; color:var(--ink); }
        .iconbtn{ width:32px; height:32px; border-radius:8px; border:1px solid var(--line-2); background:#fff; display:grid; place-items:center; color:var(--muted); cursor:pointer; }
        .iconbtn:hover{ background:var(--surface-2); color:var(--ink); }
        .enroll-form{ background:var(--surface-2); border-radius:var(--r); padding:16px; margin-bottom:18px; }
        .enroll-form .g2{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        .prog-cell{ display:flex; align-items:center; gap:8px; }
        .prog-cell .b{ width:70px; height:5px; background:#eef0f3; border-radius:999px; overflow:hidden; flex:none; }
        .prog-cell .b span{ display:block; height:100%; background:var(--blue); }
        @media(max-width:640px){ .enroll-form .g2{ grid-template-columns:1fr; } }
      `}</style>

      <div className="topbar">
        <div className="crumb"><a href="/admin">Admin</a> <span>›</span> <b>Alunos</b></div>
        <div className="avatar sm" style={{ background: 'var(--ink)' }}>FB</div>
      </div>

      <div className="content wide">
        <div className="flex between aic">
          <div>
            <h1 style={{ fontSize: '26px' }}>Alunos</h1>
            <p className="muted" style={{ marginTop: '5px', fontSize: '14px' }}>
              {filtered.length} aluno{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowEnrollForm(!showEnrollForm)}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
            Matricular manualmente
          </button>
        </div>

        {showEnrollForm && (
          <div className="enroll-form" style={{ marginTop: '16px' }}>
            <h3 style={{ fontSize: '15px', marginBottom: '14px' }}>Matricular aluno manualmente</h3>
            <form onSubmit={(e) => { void handleEnroll(e) }}>
              <div className="g2">
                <div className="field">
                  <label>E-mail do aluno</label>
                  <input className="input" type="email" placeholder="aluno@email.com" value={enrollEmail} onChange={(e) => setEnrollEmail(e.target.value)} required />
                </div>
                <div className="field">
                  <label>Curso</label>
                  <select className="input" value={enrollCourseId} onChange={(e) => setEnrollCourseId(e.target.value)} required>
                    <option value="">Selecionar curso...</option>
                    {courseOptions.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap12" style={{ marginTop: '14px', alignItems: 'center' }}>
                <button className="btn btn-primary btn-sm" type="submit" disabled={enrolling}>{enrolling ? 'Matriculando...' : 'Confirmar matrícula'}</button>
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => { setShowEnrollForm(false); setEnrollMsg('') }}>Cancelar</button>
                {enrollMsg && <span className={enrollMsg.startsWith('Erro') ? 'muted' : 'blue'} style={{ fontSize: '13px' }}>{enrollMsg}</span>}
              </div>
            </form>
          </div>
        )}

        <div className="toolbar">
          <div className="input-icn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
            <input className="input" placeholder="Buscar por nome ou e-mail..." value={search} onChange={(e) => handleSearchChange(e.target.value)} />
          </div>
          <select className="sel" value={planFilter} onChange={(e) => handlePlanChange(e.target.value)}>
            <option value="all">Todos os planos</option>
            <option value="free">Free</option>
            <option value="prata">Prata</option>
            <option value="ouro">Ouro</option>
            <option value="diamante">Diamante</option>
          </select>
          <select className="sel" value={enrollFilter} onChange={(e) => handleEnrollFilterChange(e.target.value)}>
            <option value="all">Todas as matrículas</option>
            <option value="enrolled">Com matrícula</option>
            <option value="no-enroll">Sem matrícula</option>
          </select>
          <select className="sel" value={sortBy} onChange={(e) => handleSortChange(e.target.value)}>
            <option value="recent">Mais recentes</option>
            <option value="name">Nome A-Z</option>
            <option value="enrollments">Mais matriculados</option>
          </select>
        </div>

        <div className="card">
          <table className="tbl">
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Plano</th>
                <th>Matrículas</th>
                <th>Certificados</th>
                <th>Membro desde</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted" style={{ textAlign: 'center', padding: '24px' }}>Nenhum aluno encontrado</td>
                </tr>
              )}
              {paginated.map((u) => {
                const plan = (u.plan ?? 'free').toLowerCase()
                return (
                  <tr key={u.id}>
                    <td>
                      <div className="flex aic gap12">
                        <div className="avatar sm">{initials(u.name)}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '14px' }}>{u.name}</div>
                          <div className="muted" style={{ fontSize: '12px' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`plan-badge ${PLAN_CLASSES[plan] ?? 'plan-free'}`} style={{ padding: '3px 10px' }}>
                        {PLAN_LABELS[plan] ?? u.plan ?? 'Free'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <b style={{ fontSize: '14px' }}>{u.enrollmentCount}</b>
                        {u.enrollmentCount > 0 && (
                          <span className="badge" style={{ background: '#e8f4ff', color: '#1a6aab', fontSize: '11px' }}>
                            ativo{u.enrollmentCount !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ fontWeight: u.certificateCount > 0 ? 600 : 400, color: u.certificateCount > 0 ? 'var(--ink)' : 'var(--muted)' }}>
                      {u.certificateCount > 0 ? u.certificateCount : '—'}
                    </td>
                    <td>
                      {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(u.created_at))}
                    </td>
                    <td>
                      <button
                        className="iconbtn"
                        onClick={() => setSelectedUser(u)}
                        title="Ver detalhes"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filtered.length > PAGE_SIZE && (
          <div className="flex between aic" style={{ marginTop: '16px' }}>
            <span className="muted" style={{ fontSize: '13px' }}>
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} de {filtered.length}
            </span>
            <div className="flex gap8">
              <button className="btn btn-ghost btn-sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</button>
              <button className="btn btn-ghost btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Próximo</button>
            </div>
          </div>
        )}
      </div>

      <AdminAlunoModal
        user={selectedUser}
        courseOptions={courseOptions}
        onClose={() => setSelectedUser(null)}
        onPlanChanged={handlePlanChanged}
      />
    </>
  )
}
