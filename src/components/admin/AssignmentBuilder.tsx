'use client'

import { useState, useEffect } from 'react'

interface Assignment {
  id: string
  lesson_id: string
  title: string
  instructions: string | null
  deadline: string | null
}

interface AssignmentBuilderProps {
  lessonId: string
  lessonTitle: string
  onClose: () => void
}

export function AssignmentBuilder({ lessonId, lessonTitle, onClose }: AssignmentBuilderProps) {
  const [assignment, setAssignment] = useState<Assignment | null | undefined>(undefined)
  const [form, setForm] = useState({ title: '', instructions: '', deadline: '' })
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    void fetchAssignment()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId])

  async function fetchAssignment() {
    setAssignment(undefined)
    const res = await fetch(`/api/admin/lessons/${lessonId}/assignment`)
    const data = await res.json() as Assignment | null
    setAssignment(data)
    if (data) {
      setForm({ title: data.title, instructions: data.instructions ?? '', deadline: data.deadline ? data.deadline.slice(0, 16) : '' })
    }
  }

  async function handleCreate() {
    if (!form.title.trim()) { setMsg('Título obrigatório'); return }
    setSaving(true); setMsg('')
    try {
      const res = await fetch(`/api/admin/lessons/${lessonId}/assignment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title.trim(), instructions: form.instructions.trim() || null, deadline: form.deadline || null }),
      })
      const data = await res.json() as Assignment & { error?: string }
      if (!res.ok) { setMsg(`Erro: ${data.error ?? 'falha'}`); return }
      setAssignment(data)
      setEditing(false)
    } catch { setMsg('Erro de conexão') }
    finally { setSaving(false) }
  }

  async function handleUpdate() {
    if (!assignment || !form.title.trim()) { setMsg('Título obrigatório'); return }
    setSaving(true); setMsg('')
    try {
      const res = await fetch(`/api/admin/assignments/${assignment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title.trim(), instructions: form.instructions.trim() || null, deadline: form.deadline || null }),
      })
      const data = await res.json() as Assignment & { error?: string }
      if (!res.ok) { setMsg(`Erro: ${data.error ?? 'falha'}`); return }
      setAssignment(data)
      setEditing(false)
    } catch { setMsg('Erro de conexão') }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!assignment) return
    if (!confirm(`Deletar tarefa "${assignment.title}"?`)) return
    await fetch(`/api/admin/assignments/${assignment.id}`, { method: 'DELETE' })
    setAssignment(null)
    setForm({ title: '', instructions: '', deadline: '' })
  }

  function openCreate() {
    setForm({ title: '', instructions: '', deadline: '' })
    setEditing(true)
    setMsg('')
  }

  function openEdit() {
    if (!assignment) return
    setForm({ title: assignment.title, instructions: assignment.instructions ?? '', deadline: assignment.deadline ? assignment.deadline.slice(0, 16) : '' })
    setEditing(true)
    setMsg('')
  }

  const showForm = editing || assignment === null

  return (
    <div style={{ border: '1px solid #f59e0b', borderRadius: '12px', padding: '16px', marginTop: '10px', background: '#fffbeb' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: '13.5px' }}>Tarefa</span>
          <span className="muted" style={{ fontSize: '12px', marginLeft: '8px' }}>{lessonTitle}</span>
        </div>
        <button
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'var(--muted)', padding: '2px 6px' }}
          onClick={onClose}
          title="Fechar"
        >
          ✕
        </button>
      </div>

      {assignment === undefined && (
        <p className="muted" style={{ fontSize: '13px' }}>Carregando...</p>
      )}

      {assignment && !editing && (
        <div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '13px' }}>{assignment.title}</div>
              {assignment.instructions && (
                <div className="muted" style={{ fontSize: '12px', marginTop: '4px', whiteSpace: 'pre-wrap' }}>{assignment.instructions}</div>
              )}
              {assignment.deadline && (
                <div className="muted" style={{ fontSize: '11px', marginTop: '4px' }}>
                  Prazo: {new Date(assignment.deadline).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
              <button className="iconbtn-xs" onClick={openEdit} title="Editar">✎</button>
              <button className="iconbtn-xs" style={{ color: 'var(--red,#e53e3e)' }} onClick={() => void handleDelete()} title="Deletar">✕</button>
            </div>
          </div>
          <a
            href={`/admin/tarefas/${assignment.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '12px', display: 'inline-block' }}
          >
            Ver submissões →
          </a>
        </div>
      )}

      {showForm && (
        <div>
          {assignment === null && !editing && (
            <p className="muted" style={{ fontSize: '13px', marginBottom: '12px' }}>
              Esta aula não tem tarefa. Crie uma agora:
            </p>
          )}
          <div style={{ display: 'grid', gap: '8px', marginBottom: '10px' }}>
            <div className="field">
              <label style={{ fontSize: '12px' }}>Título *</label>
              <input
                className="input"
                style={{ fontSize: '13px' }}
                placeholder="Ex: Protocolo de radiofrequência facial"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="field">
              <label style={{ fontSize: '12px' }}>Instruções</label>
              <textarea
                className="input"
                rows={3}
                style={{ fontSize: '13px', resize: 'vertical' }}
                placeholder="Descreva o que o aluno deve entregar..."
                value={form.instructions}
                onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
              />
            </div>
            <div className="field">
              <label style={{ fontSize: '12px' }}>Prazo (opcional)</label>
              <input
                className="input"
                type="datetime-local"
                style={{ fontSize: '13px' }}
                value={form.deadline}
                onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => void (assignment ? handleUpdate() : handleCreate())}
              disabled={saving}
            >
              {saving ? 'Salvando...' : assignment ? 'Salvar' : 'Criar tarefa'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(false); setMsg('') }}>
              Cancelar
            </button>
            {msg && <span className="muted" style={{ fontSize: '12px' }}>{msg}</span>}
          </div>
        </div>
      )}

      {assignment === null && !editing && (
        <button className="btn btn-ghost btn-sm" style={{ fontSize: '12px' }} onClick={openCreate}>
          + Criar tarefa
        </button>
      )}
    </div>
  )
}
