'use client'

import { useState } from 'react'
import { QuizBuilder } from './QuizBuilder'
import { AssignmentBuilder } from './AssignmentBuilder'

export interface LessonRow {
  id: string
  module_id: string
  title: string
  type: 'video' | 'text' | 'pdf' | 'embed'
  vimeo_id: string | null
  content_body: string | null
  embed_url: string | null
  pdf_url: string | null
  duration_secs: number
  order: number
  is_free_preview: boolean
}

interface LessonEditorProps {
  lessons: LessonRow[]
  moduleId: string
  onLessonsChange: (lessons: LessonRow[]) => void
}

interface LessonForm {
  title: string
  type: 'video' | 'text' | 'pdf' | 'embed'
  vimeo_id: string
  content_body: string
  embed_url: string
  pdf_url: string
  duration_secs: string
  is_free_preview: boolean
}

const TYPE_LABELS: Record<string, string> = {
  video: 'VIDEO',
  text: 'TEXTO',
  pdf: 'PDF',
  embed: 'EMBED',
}

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  video: { bg: '#e3f2fd', color: '#1565c0' },
  text: { bg: '#f3e5f5', color: '#7b1fa2' },
  pdf: { bg: '#fff3e0', color: '#e65100' },
  embed: { bg: '#e0f2f1', color: '#00695c' },
}

const EMPTY_FORM: LessonForm = {
  title: '',
  type: 'video',
  vimeo_id: '',
  content_body: '',
  embed_url: '',
  pdf_url: '',
  duration_secs: '',
  is_free_preview: false,
}

function fmtDuration(secs: number) {
  if (!secs) return '-'
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function LessonEditor({ lessons, moduleId, onLessonsChange }: LessonEditorProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [quizLessonId, setQuizLessonId] = useState<string | null>(null)
  const [assignmentLessonId, setAssignmentLessonId] = useState<string | null>(null)
  const [form, setForm] = useState<LessonForm>({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  function openAdd() {
    setEditingId(null)
    setForm({ ...EMPTY_FORM })
    setShowDialog(true)
    setMsg('')
  }

  async function openEdit(lesson: LessonRow) {
    let fullLesson = lesson
    if (lesson.type === 'text' && lesson.content_body === null) {
      try {
        const res = await fetch(`/api/admin/lessons/${lesson.id}`)
        if (res.ok) fullLesson = (await res.json()) as LessonRow
      } catch {
        // Keep the lightweight row; the save path will still validate title/type.
      }
    }

    setEditingId(lesson.id)
    setForm({
      title: fullLesson.title,
      type: fullLesson.type ?? 'video',
      vimeo_id: fullLesson.vimeo_id ?? '',
      content_body: fullLesson.content_body ?? '',
      embed_url: fullLesson.embed_url ?? '',
      pdf_url: fullLesson.pdf_url ?? '',
      duration_secs: String(fullLesson.duration_secs),
      is_free_preview: fullLesson.is_free_preview,
    })
    setShowDialog(true)
    setMsg('')
  }

  function closeDialog() {
    setShowDialog(false)
    setEditingId(null)
    setMsg('')
  }

  async function handleSave() {
    if (!form.title.trim()) {
      setMsg('Titulo obrigatorio')
      return
    }

    setSaving(true)
    setMsg('')
    try {
      const payload = {
        title: form.title.trim(),
        type: form.type,
        vimeo_id: form.type === 'video' ? form.vimeo_id.trim() || null : null,
        content_body: form.type === 'text' ? form.content_body.trim() || null : null,
        embed_url: form.type === 'embed' ? form.embed_url.trim() || null : null,
        pdf_url: form.type === 'pdf' ? form.pdf_url.trim() || null : null,
        duration_secs: parseInt(form.duration_secs) || 0,
        is_free_preview: form.is_free_preview,
      }

      if (editingId) {
        const res = await fetch(`/api/admin/lessons/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = (await res.json()) as LessonRow & { error?: string }
        if (!res.ok) {
          setMsg(`Erro: ${data.error ?? 'falha'}`)
          return
        }
        onLessonsChange(lessons.map((lesson) => (lesson.id === editingId ? { ...lesson, ...data } : lesson)))
        closeDialog()
      } else {
        const maxOrder = lessons.length > 0 ? Math.max(...lessons.map((lesson) => lesson.order)) + 1 : 0
        const res = await fetch(`/api/admin/modules/${moduleId}/lessons`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, order: maxOrder }),
        })
        const data = (await res.json()) as LessonRow & { error?: string }
        if (!res.ok) {
          setMsg(`Erro: ${data.error ?? 'falha'}`)
          return
        }
        onLessonsChange([...lessons, data])
        closeDialog()
      }
    } catch {
      setMsg('Erro de conexao')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(lesson: LessonRow) {
    if (!confirm(`Deletar aula "${lesson.title}"?`)) return
    const res = await fetch(`/api/admin/lessons/${lesson.id}`, { method: 'DELETE' })
    if (res.ok) onLessonsChange(lessons.filter((item) => item.id !== lesson.id))
  }

  async function handleReorder(idx: number, dir: -1 | 1) {
    const sortedLessons = [...lessons].sort((a, b) => a.order - b.order)
    const targetIdx = idx + dir
    if (targetIdx < 0 || targetIdx >= sortedLessons.length) return
    const current = sortedLessons[idx]
    const target = sortedLessons[targetIdx]

    await Promise.all([
      fetch(`/api/admin/lessons/${current.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: target.order }),
      }),
      fetch(`/api/admin/lessons/${target.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: current.order }),
      }),
    ])

    onLessonsChange(
      lessons.map((lesson) => {
        if (lesson.id === current.id) return { ...lesson, order: target.order }
        if (lesson.id === target.id) return { ...lesson, order: current.order }
        return lesson
      })
    )
  }

  const sorted = [...lessons].sort((a, b) => a.order - b.order)

  return (
    <div style={{ paddingLeft: '16px', borderLeft: '2px solid var(--line)', marginTop: '8px' }}>
      <style>{`
        .lesson-row{ display:flex; align-items:center; gap:8px; padding:8px 10px; background:#fff; border:1px solid var(--line); border-radius:8px; margin-bottom:6px; font-size:13px; }
        .lesson-actions{ display:flex; gap:4px; flex-shrink:0; }
        .lesson-modal-backdrop{ position:fixed; inset:0; z-index:90; background:rgba(15,16,20,.5); display:grid; place-items:center; padding:18px; }
        .lesson-modal{ width:min(760px,100%); max-height:calc(100vh - 36px); overflow:auto; background:#fff; border:1px solid var(--line); border-radius:12px; box-shadow:0 18px 60px rgba(0,0,0,.24); }
        .lesson-modal-h{ display:flex; justify-content:space-between; align-items:flex-start; gap:14px; padding:18px 20px 12px; border-bottom:1px solid var(--line); }
        .lesson-modal-h h3{ font-size:17px; margin:0; }
        .lesson-modal-b{ padding:18px 20px; }
        .lesson-modal-f{ display:flex; justify-content:space-between; align-items:center; gap:8px; padding:14px 20px 18px; border-top:1px solid var(--line); }
        .lesson-type-row{ display:flex; gap:6px; flex-wrap:wrap; margin-top:4px; }
        .lesson-type-btn{ padding:6px 12px; font-size:12px; border-radius:7px; border:1px solid var(--line); background:#fff; color:var(--muted); font-weight:600; cursor:pointer; }
        .lesson-grid{ display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px; }
        @media(max-width:700px){ .lesson-grid{ grid-template-columns:1fr; } .lesson-modal-f{ flex-direction:column; align-items:stretch; } }
      `}</style>

      {sorted.map((lesson, i) => (
        <div key={lesson.id}>
          <div className="lesson-row">
            <span style={{ color: 'var(--faint)', fontSize: '15px' }}>▶</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontWeight: 500 }}>{lesson.title}</span>
              <span className="badge" style={{ marginLeft: '6px', background: TYPE_COLORS[lesson.type ?? 'video']?.bg ?? '#e3f2fd', color: TYPE_COLORS[lesson.type ?? 'video']?.color ?? '#1565c0', fontSize: '10px', padding: '1px 6px' }}>
                {TYPE_LABELS[lesson.type ?? 'video']}
              </span>
              {lesson.vimeo_id && <span className="muted" style={{ marginLeft: '8px', fontSize: '11px' }}>#{lesson.vimeo_id.slice(0, 8)}...</span>}
              {lesson.is_free_preview && <span className="badge" style={{ marginLeft: '6px', background: '#e8f5e9', color: '#2e7d32', fontSize: '10px', padding: '1px 6px' }}>Preview</span>}
            </div>
            <span className="muted" style={{ fontSize: '11px', flexShrink: 0 }}>{fmtDuration(lesson.duration_secs)}</span>
            <div className="lesson-actions">
              <button className="iconbtn" style={{ width: '26px', height: '26px', fontSize: '12px' }} onClick={() => handleReorder(i, -1)} disabled={i === 0} title="Subir">↑</button>
              <button className="iconbtn" style={{ width: '26px', height: '26px', fontSize: '12px' }} onClick={() => handleReorder(i, 1)} disabled={i === sorted.length - 1} title="Descer">↓</button>
              <button className="iconbtn" style={{ width: '26px', height: '26px', fontSize: '11px' }} onClick={() => { void openEdit(lesson) }} title="Editar">✎</button>
              <button
                className="iconbtn"
                style={{ width: '26px', height: '26px', fontSize: '10px', color: quizLessonId === lesson.id ? 'var(--blue)' : 'var(--muted)' }}
                onClick={() => { setQuizLessonId((prev) => (prev === lesson.id ? null : lesson.id)); setAssignmentLessonId(null) }}
                title="Gerenciar quiz"
              >
                Q
              </button>
              <button
                className="iconbtn"
                style={{ width: '26px', height: '26px', fontSize: '10px', color: assignmentLessonId === lesson.id ? '#f59e0b' : 'var(--muted)' }}
                onClick={() => { setAssignmentLessonId((prev) => (prev === lesson.id ? null : lesson.id)); setQuizLessonId(null) }}
                title="Gerenciar tarefa"
              >
                T
              </button>
              <button className="iconbtn" style={{ width: '26px', height: '26px', fontSize: '12px', color: 'var(--red, #e53e3e)' }} onClick={() => { void handleDelete(lesson) }} title="Deletar">×</button>
            </div>
          </div>
          {quizLessonId === lesson.id && (
            <QuizBuilder lessonId={lesson.id} lessonTitle={lesson.title} onClose={() => setQuizLessonId(null)} />
          )}
          {assignmentLessonId === lesson.id && (
            <AssignmentBuilder lessonId={lesson.id} lessonTitle={lesson.title} onClose={() => setAssignmentLessonId(null)} />
          )}
        </div>
      ))}

      <button className="btn btn-ghost btn-sm" style={{ fontSize: '12px', marginTop: '4px' }} onClick={openAdd}>
        + Adicionar aula
      </button>

      {showDialog && (
        <div className="lesson-modal-backdrop" role="dialog" aria-modal="true">
          <div className="lesson-modal">
            <div className="lesson-modal-h">
              <div>
                <h3>{editingId ? 'Editar aula' : 'Nova aula'}</h3>
                <p className="muted" style={{ fontSize: '13px', marginTop: '4px' }}>
                  Cadastre video Vimeo, texto, PDF ou embed em uma janela dedicada.
                </p>
              </div>
              <button className="iconbtn" type="button" onClick={closeDialog} title="Fechar">×</button>
            </div>

            <div className="lesson-modal-b">
              <div className="field" style={{ marginBottom: '12px' }}>
                <label>Tipo de aula</label>
                <div className="lesson-type-row">
                  {(['video', 'text', 'pdf', 'embed'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      className="lesson-type-btn"
                      onClick={() => setForm((value) => ({ ...value, type }))}
                      style={{
                        background: form.type === type ? TYPE_COLORS[type].bg : '#fff',
                        color: form.type === type ? TYPE_COLORS[type].color : 'var(--muted)',
                        borderColor: form.type === type ? TYPE_COLORS[type].color : 'var(--line)',
                      }}
                    >
                      {TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="lesson-grid">
                <div className="field">
                  <label>Titulo da aula *</label>
                  <input className="input" value={form.title} onChange={(event) => setForm((value) => ({ ...value, title: event.target.value }))} placeholder="Ex: Introducao ao protocolo" autoFocus />
                </div>

                {form.type === 'video' && (
                  <div className="field">
                    <label>Vimeo ID, URL ou iframe</label>
                    <input className="input" value={form.vimeo_id} onChange={(event) => setForm((value) => ({ ...value, vimeo_id: event.target.value }))} placeholder="Ex: 123456789 ou player.vimeo.com/video/..." />
                  </div>
                )}

                {form.type === 'pdf' && (
                  <div className="field">
                    <label>URL do PDF</label>
                    <input className="input" value={form.pdf_url} onChange={(event) => setForm((value) => ({ ...value, pdf_url: event.target.value }))} placeholder="https://exemplo.com/arquivo.pdf" />
                  </div>
                )}

                {form.type === 'embed' && (
                  <div className="field">
                    <label>URL do Embed</label>
                    <input className="input" value={form.embed_url} onChange={(event) => setForm((value) => ({ ...value, embed_url: event.target.value }))} placeholder="https://exemplo.com/embed" />
                  </div>
                )}

                <div className="field">
                  <label>Duracao (segundos)</label>
                  <input className="input" type="number" min="0" value={form.duration_secs} onChange={(event) => setForm((value) => ({ ...value, duration_secs: event.target.value }))} placeholder="Ex: 1800" />
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '22px', fontSize: '13px', fontWeight: 600 }}>
                  <input type="checkbox" checked={form.is_free_preview} onChange={(event) => setForm((value) => ({ ...value, is_free_preview: event.target.checked }))} />
                  Preview gratuito
                </label>
              </div>

              {form.type === 'text' && (
                <div className="field" style={{ marginBottom: '12px' }}>
                  <label>Conteudo da aula</label>
                  <textarea
                    className="input"
                    value={form.content_body}
                    onChange={(event) => setForm((value) => ({ ...value, content_body: event.target.value }))}
                    placeholder="Escreva o conteúdo da aula aqui..."
                    rows={8}
                    style={{ resize: 'vertical', width: '100%', fontFamily: 'inherit' }}
                  />
                </div>
              )}

              {form.type === 'embed' && form.embed_url.trim() && (
                <div style={{ marginTop: '8px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--muted)' }}>Preview do embed</label>
                  <iframe
                    src={form.embed_url.trim()}
                    style={{ width: '100%', height: '220px', border: '1px solid var(--line)', borderRadius: '8px', marginTop: '4px' }}
                    title="Preview do embed"
                  />
                </div>
              )}

              {msg && <p className="muted" style={{ fontSize: '13px', marginTop: '10px' }}>{msg}</p>}
            </div>

            <div className="lesson-modal-f">
              <span className="muted" style={{ fontSize: '12.5px' }}>
                {form.type === 'video' ? 'Cole o ID, link ou iframe do Vimeo.' : 'Complete os campos principais da aula.'}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-ghost btn-sm" type="button" onClick={closeDialog}>Cancelar</button>
                <button className="btn btn-primary btn-sm" type="button" onClick={() => { void handleSave() }} disabled={saving}>
                  {saving ? 'Salvando...' : editingId ? 'Salvar' : 'Adicionar aula'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
