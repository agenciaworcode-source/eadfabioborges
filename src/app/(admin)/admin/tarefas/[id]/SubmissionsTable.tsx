'use client'

import { useState } from 'react'

interface SubmissionRow {
  id: string
  user_id: string
  assignment_id: string
  file_url: string | null
  grade: number | null
  feedback: string | null
  graded_at: string | null
  created_at: string
  users: { name: string; email: string } | null
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

function GradeForm({
  submission,
  onGraded,
}: {
  submission: SubmissionRow
  onGraded: (grade: number, feedback: string) => void
}) {
  const [gradeVal, setGradeVal] = useState(submission.grade !== null ? String(submission.grade) : '')
  const [feedbackVal, setFeedbackVal] = useState(submission.feedback ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const gradeNum = Number(gradeVal)
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 100) {
      setError('Nota deve ser entre 0 e 100.')
      return
    }
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/assignment/submission/${submission.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade: gradeNum, feedback: feedbackVal }),
      })
      if (!res.ok) {
        const err = (await res.json()) as { error: string }
        throw new Error(err.error ?? 'Erro ao salvar nota')
      }
      onGraded(gradeNum, feedbackVal)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={(e) => { void handleSubmit(e) }} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', gap: '6px' }}>
        <input
          type="number"
          min={0}
          max={100}
          placeholder="Nota (0-100)"
          value={gradeVal}
          onChange={(e) => setGradeVal(e.target.value)}
          className="input"
          style={{ width: '110px', fontSize: '13px' }}
          required
        />
      </div>
      <textarea
        placeholder="Feedback (opcional)"
        value={feedbackVal}
        onChange={(e) => setFeedbackVal(e.target.value)}
        rows={2}
        className="input"
        style={{ fontSize: '13px', resize: 'none' }}
      />
      {error && <p style={{ fontSize: '12px', color: 'var(--red,#e53e3e)' }}>{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary btn-sm"
        style={{ alignSelf: 'flex-start' }}
      >
        {loading ? 'Salvando...' : 'Salvar nota'}
      </button>
    </form>
  )
}

export function SubmissionsTable({ submissions: initial }: { submissions: SubmissionRow[] }) {
  const [rows, setRows] = useState<SubmissionRow[]>(initial)

  function handleGraded(id: string, grade: number, feedback: string) {
    setRows(prev => prev.map(r => r.id === id ? { ...r, grade, feedback, graded_at: new Date().toISOString() } : r))
  }

  if (rows.length === 0) {
    return <p className="muted" style={{ fontSize: '14px' }}>Nenhuma entrega ainda.</p>
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--line)', textAlign: 'left' }}>
            <th style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--ink-2)', fontSize: '12px' }}>Aluno</th>
            <th style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--ink-2)', fontSize: '12px' }}>Entregue em</th>
            <th style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--ink-2)', fontSize: '12px' }}>Arquivo</th>
            <th style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--ink-2)', fontSize: '12px' }}>Status</th>
            <th style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--ink-2)', fontSize: '12px', minWidth: '260px' }}>Corrigir</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((sub) => (
            <tr key={sub.id} style={{ borderBottom: '1px solid var(--line)' }}>
              <td style={{ padding: '10px 12px' }}>
                <div style={{ fontWeight: 600 }}>{sub.users?.name ?? 'Sem nome'}</div>
                <div className="muted" style={{ fontSize: '12px' }}>{sub.users?.email ?? sub.user_id}</div>
              </td>
              <td style={{ padding: '10px 12px' }} className="muted">{formatDate(sub.created_at)}</td>
              <td style={{ padding: '10px 12px' }}>
                {sub.file_url ? (
                  <a
                    href={sub.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '12px' }}
                  >
                    Ver arquivo ↗
                  </a>
                ) : (
                  <span className="muted">—</span>
                )}
              </td>
              <td style={{ padding: '10px 12px' }}>
                {sub.grade !== null ? (
                  <span className="badge green dot" style={{ fontSize: '11px' }}>Corrigida {sub.grade}/100</span>
                ) : (
                  <span className="badge" style={{ background: '#fdeede', color: '#b5790f', fontSize: '11px' }}>Pendente</span>
                )}
              </td>
              <td style={{ padding: '10px 12px' }}>
                <GradeForm
                  submission={sub}
                  onGraded={(grade, feedback) => handleGraded(sub.id, grade, feedback)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
