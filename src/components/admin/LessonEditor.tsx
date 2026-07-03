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
  youtube_url: string | null
  video_thumbnail_url: string | null
  completion_percent: number
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

type VideoSource = 'vimeo' | 'youtube'

interface LessonForm {
  title: string
  type: 'video' | 'text' | 'pdf' | 'embed'
  video_source: VideoSource
  vimeo_id: string
  youtube_url: string
  video_thumbnail_url: string
  completion_percent: string
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
  video_source: 'vimeo',
  vimeo_id: '',
  youtube_url: '',
  video_thumbnail_url: '',
  completion_percent: '0',
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
      video_source: fullLesson.youtube_url ? 'youtube' : 'vimeo',
      vimeo_id: fullLesson.vimeo_id ?? '',
      youtube_url: fullLesson.youtube_url ?? '',
      video_thumbnail_url: fullLesson.video_thumbnail_url ?? '',
      completion_percent: String(fullLesson.completion_percent ?? 0),
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
        vimeo_id:
          form.type === 'video' && form.video_source === 'vimeo'
            ? form.vimeo_id.trim() || null
            : null,
        youtube_url:
          form.type === 'video' && form.video_source === 'youtube'
            ? form.youtube_url.trim() || null
            : null,
        video_thumbnail_url: form.type === 'video' ? form.video_thumbnail_url.trim() || null : null,
        completion_percent: form.type === 'video' ? parseInt(form.completion_percent) || 0 : 0,
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
        onLessonsChange(
          lessons.map((lesson) => (lesson.id === editingId ? { ...lesson, ...data } : lesson))
        )
        closeDialog()
      } else {
        const maxOrder =
          lessons.length > 0 ? Math.max(...lessons.map((lesson) => lesson.order)) + 1 : 0
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
        .lesson-card{ background:#fff; border:1px solid var(--line); border-radius:10px; margin-bottom:8px; overflow:hidden; transition:border-color .15s; }
        .lesson-card:hover{ border-color:#c5d5e8; }
        .lesson-card-top{ display:flex; align-items:center; gap:10px; padding:11px 12px 10px; }
        .lesson-card-info{ flex:1; min-width:0; }
        .lesson-card-title{ font-weight:600; font-size:13.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .lesson-card-meta{ display:flex; align-items:center; gap:6px; margin-top:3px; flex-wrap:wrap; }
        .lesson-card-actions{ display:flex; align-items:center; gap:4px; border-top:1px solid #f0f2f5; padding:7px 12px; background:#fafbfc; }
        .lesson-act-btn{ display:flex; align-items:center; gap:5px; height:32px; padding:0 10px; border-radius:7px; border:1px solid var(--line); background:#fff; font-size:12px; font-weight:600; color:var(--ink-2); cursor:pointer; transition:all .15s; white-space:nowrap; }
        .lesson-act-btn:hover{ background:var(--surface-2); border-color:#b5c5d8; color:var(--ink); }
        .lesson-act-btn:disabled{ opacity:.35; cursor:not-allowed; }
        .lesson-act-btn.active-quiz{ background:#e8f4ff; border-color:#90c5f7; color:#1565c0; }
        .lesson-act-btn.active-task{ background:#fff8e6; border-color:#f5c518; color:#b5790f; }
        .lesson-act-btn.danger{ color:#c53030; border-color:#fed7d7; background:#fff5f5; }
        .lesson-act-btn.danger:hover{ background:#fed7d7; }
        .lesson-act-sep{ width:1px; height:22px; background:var(--line); margin:0 2px; flex-shrink:0; }
        .lesson-act-order{ display:flex; align-items:center; gap:2px; }
        .lesson-ord-btn{ width:30px; height:30px; border-radius:6px; border:1px solid var(--line); background:#fff; display:grid; place-items:center; cursor:pointer; color:var(--muted); transition:all .15s; }
        .lesson-ord-btn:hover{ background:var(--surface-2); color:var(--ink); }
        .lesson-ord-btn:disabled{ opacity:.3; cursor:not-allowed; }
        .lesson-modal-backdrop{ position:fixed; inset:0; z-index:90; background:rgba(15,16,20,.5); display:grid; place-items:center; padding:18px; }
        .lesson-modal{ width:min(760px,100%); max-height:calc(100vh - 36px); overflow:auto; background:#fff; border:1px solid var(--line); border-radius:12px; box-shadow:0 18px 60px rgba(0,0,0,.24); }
        .lesson-modal-h{ display:flex; justify-content:space-between; align-items:flex-start; gap:14px; padding:18px 20px 12px; border-bottom:1px solid var(--line); }
        .lesson-modal-h h3{ font-size:17px; margin:0; }
        .lesson-modal-b{ padding:18px 20px; }
        .lesson-modal-f{ display:flex; justify-content:space-between; align-items:center; gap:8px; padding:14px 20px 18px; border-top:1px solid var(--line); }
        .lesson-type-row{ display:flex; gap:6px; flex-wrap:wrap; margin-top:4px; }
        .lesson-type-btn{ padding:6px 12px; font-size:12px; border-radius:7px; border:1px solid var(--line); background:#fff; color:var(--muted); font-weight:600; cursor:pointer; }
        .lesson-grid{ display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px; }
        @media(max-width:700px){ .lesson-grid{ grid-template-columns:1fr; } .lesson-modal-f{ flex-direction:column; align-items:stretch; } .lesson-card-actions{ flex-wrap:wrap; } }
      `}</style>

      {sorted.map((lesson, i) => (
        <div key={lesson.id}>
          <div className="lesson-card">
            {/* Linha de info */}
            <div className="lesson-card-top">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--faint)"
                strokeWidth="2"
                style={{ flexShrink: 0 }}
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <div className="lesson-card-info">
                <div className="lesson-card-title">{lesson.title}</div>
                <div className="lesson-card-meta">
                  <span
                    style={{
                      background: TYPE_COLORS[lesson.type ?? 'video']?.bg ?? '#e3f2fd',
                      color: TYPE_COLORS[lesson.type ?? 'video']?.color ?? '#1565c0',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '1px 7px',
                      borderRadius: '5px',
                    }}
                  >
                    {TYPE_LABELS[lesson.type ?? 'video']}
                  </span>
                  {lesson.duration_secs > 0 && (
                    <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                      {fmtDuration(lesson.duration_secs)}
                    </span>
                  )}
                  {lesson.vimeo_id && (
                    <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Vimeo</span>
                  )}
                  {lesson.youtube_url && (
                    <span style={{ fontSize: '11px', color: 'var(--muted)' }}>YouTube</span>
                  )}
                  {lesson.is_free_preview && (
                    <span
                      style={{
                        background: '#e8f5e9',
                        color: '#2e7d32',
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '1px 7px',
                        borderRadius: '5px',
                      }}
                    >
                      Preview
                    </span>
                  )}
                  {quizLessonId === lesson.id && (
                    <span
                      style={{
                        background: '#e8f4ff',
                        color: '#1565c0',
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '1px 7px',
                        borderRadius: '5px',
                      }}
                    >
                      Quiz aberto
                    </span>
                  )}
                  {assignmentLessonId === lesson.id && (
                    <span
                      style={{
                        background: '#fff8e6',
                        color: '#b5790f',
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '1px 7px',
                        borderRadius: '5px',
                      }}
                    >
                      Tarefa aberta
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Toolbar de ações */}
            <div className="lesson-card-actions">
              {/* Reordenar */}
              <div className="lesson-act-order">
                <button
                  className="lesson-ord-btn"
                  onClick={() => handleReorder(i, -1)}
                  disabled={i === 0}
                  title="Mover para cima"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M18 15l-6-6-6 6" />
                  </svg>
                </button>
                <button
                  className="lesson-ord-btn"
                  onClick={() => handleReorder(i, 1)}
                  disabled={i === sorted.length - 1}
                  title="Mover para baixo"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              </div>

              <div className="lesson-act-sep" />

              {/* Editar */}
              <button
                className="lesson-act-btn"
                onClick={() => {
                  void openEdit(lesson)
                }}
                title="Editar aula"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Editar
              </button>

              {/* Quiz */}
              <button
                className={`lesson-act-btn${quizLessonId === lesson.id ? ' active-quiz' : ''}`}
                onClick={() => {
                  setQuizLessonId((prev) => (prev === lesson.id ? null : lesson.id))
                  setAssignmentLessonId(null)
                }}
                title="Gerenciar quiz desta aula"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                Quiz
              </button>

              {/* Tarefa */}
              <button
                className={`lesson-act-btn${assignmentLessonId === lesson.id ? ' active-task' : ''}`}
                onClick={() => {
                  setAssignmentLessonId((prev) => (prev === lesson.id ? null : lesson.id))
                  setQuizLessonId(null)
                }}
                title="Gerenciar tarefa desta aula"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                Tarefa
              </button>

              <div style={{ flex: 1 }} />

              {/* Deletar */}
              <button
                className="lesson-act-btn danger"
                onClick={() => {
                  void handleDelete(lesson)
                }}
                title="Excluir aula"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4h6v2" />
                </svg>
                Excluir
              </button>
            </div>
          </div>
          {quizLessonId === lesson.id && (
            <QuizBuilder
              lessonId={lesson.id}
              lessonTitle={lesson.title}
              onClose={() => setQuizLessonId(null)}
            />
          )}
          {assignmentLessonId === lesson.id && (
            <AssignmentBuilder
              lessonId={lesson.id}
              lessonTitle={lesson.title}
              onClose={() => setAssignmentLessonId(null)}
            />
          )}
        </div>
      ))}

      <button
        className="btn btn-ghost btn-sm"
        style={{ fontSize: '12px', marginTop: '4px' }}
        onClick={openAdd}
      >
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
              <button className="iconbtn" type="button" onClick={closeDialog} title="Fechar">
                ×
              </button>
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
                  <input
                    className="input"
                    value={form.title}
                    onChange={(event) =>
                      setForm((value) => ({ ...value, title: event.target.value }))
                    }
                    placeholder="Ex: Introducao ao protocolo"
                    autoFocus
                  />
                </div>

                {form.type === 'video' && (
                  <>
                    <div className="field" style={{ gridColumn: '1 / -1' }}>
                      <label>Plataforma do vídeo</label>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                        {(['vimeo', 'youtube'] as VideoSource[]).map((src) => (
                          <button
                            key={src}
                            type="button"
                            className="lesson-type-btn"
                            onClick={() => setForm((v) => ({ ...v, video_source: src }))}
                            style={{
                              background: form.video_source === src ? '#e3f2fd' : '#fff',
                              color: form.video_source === src ? '#1565c0' : 'var(--muted)',
                              borderColor: form.video_source === src ? '#1565c0' : 'var(--line)',
                              textTransform: 'capitalize',
                            }}
                          >
                            {src === 'vimeo' ? 'Vimeo' : 'YouTube'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {form.video_source === 'vimeo' ? (
                      <div className="field">
                        <label>Vimeo ID, URL ou iframe</label>
                        <input
                          className="input"
                          value={form.vimeo_id}
                          onChange={(event) =>
                            setForm((v) => ({ ...v, vimeo_id: event.target.value }))
                          }
                          placeholder="Ex: 123456789 ou player.vimeo.com/video/..."
                        />
                      </div>
                    ) : (
                      <div className="field">
                        <label>URL do YouTube</label>
                        <input
                          className="input"
                          value={form.youtube_url}
                          onChange={(event) =>
                            setForm((v) => ({ ...v, youtube_url: event.target.value }))
                          }
                          placeholder="Ex: https://youtu.be/abc123 ou youtube.com/watch?v=..."
                        />
                      </div>
                    )}

                    <div className="field">
                      <label>Thumbnail do player (URL)</label>
                      <input
                        className="input"
                        value={form.video_thumbnail_url}
                        onChange={(event) =>
                          setForm((v) => ({ ...v, video_thumbnail_url: event.target.value }))
                        }
                        placeholder="https://exemplo.com/thumb.jpg (opcional)"
                      />
                    </div>

                    <div className="field">
                      <label>% assistido para concluir (0 = sem requisito)</label>
                      <input
                        className="input"
                        type="number"
                        min="0"
                        max="100"
                        value={form.completion_percent}
                        onChange={(event) =>
                          setForm((v) => ({ ...v, completion_percent: event.target.value }))
                        }
                        placeholder="Ex: 80"
                      />
                    </div>
                  </>
                )}

                {form.type === 'pdf' && (
                  <div className="field">
                    <label>URL do PDF</label>
                    <input
                      className="input"
                      value={form.pdf_url}
                      onChange={(event) =>
                        setForm((value) => ({ ...value, pdf_url: event.target.value }))
                      }
                      placeholder="https://exemplo.com/arquivo.pdf"
                    />
                  </div>
                )}

                {form.type === 'embed' && (
                  <div className="field" style={{ gridColumn: '1 / -1' }}>
                    <label>URL ou código iframe do Embed</label>
                    <textarea
                      className="input"
                      rows={4}
                      style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '12px' }}
                      value={form.embed_url}
                      onChange={(event) =>
                        setForm((value) => ({ ...value, embed_url: event.target.value }))
                      }
                      placeholder={
                        'Cole a URL ou o código <iframe> completo. Ex:\nhttps://player.vimeo.com/video/123\n\nou\n\n<iframe src="https://..." ...></iframe>'
                      }
                    />
                    <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                      Aceita URL direta ou código HTML do iframe (Vimeo, YouTube, etc.)
                    </p>
                  </div>
                )}

                <div className="field">
                  <label>Duracao (segundos)</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    value={form.duration_secs}
                    onChange={(event) =>
                      setForm((value) => ({ ...value, duration_secs: event.target.value }))
                    }
                    placeholder="Ex: 1800"
                  />
                </div>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    paddingTop: '22px',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.is_free_preview}
                    onChange={(event) =>
                      setForm((value) => ({ ...value, is_free_preview: event.target.checked }))
                    }
                  />
                  Preview gratuito
                </label>
              </div>

              {form.type === 'text' && (
                <div className="field" style={{ marginBottom: '12px' }}>
                  <label>Conteudo da aula</label>
                  <textarea
                    className="input"
                    value={form.content_body}
                    onChange={(event) =>
                      setForm((value) => ({ ...value, content_body: event.target.value }))
                    }
                    placeholder="Escreva o conteúdo da aula aqui..."
                    rows={8}
                    style={{ resize: 'vertical', width: '100%', fontFamily: 'inherit' }}
                  />
                </div>
              )}

              {form.type === 'embed' && form.embed_url.trim() && (
                <div style={{ marginTop: '8px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    Preview do embed
                  </label>
                  {form.embed_url.trimStart().startsWith('<') ? (
                    <div
                      style={{
                        width: '100%',
                        border: '1px solid var(--line)',
                        borderRadius: '8px',
                        marginTop: '4px',
                        overflow: 'hidden',
                      }}
                      dangerouslySetInnerHTML={{ __html: form.embed_url.trim() }}
                    />
                  ) : (
                    <iframe
                      src={form.embed_url.trim()}
                      style={{
                        width: '100%',
                        height: '220px',
                        border: '1px solid var(--line)',
                        borderRadius: '8px',
                        marginTop: '4px',
                      }}
                      title="Preview do embed"
                    />
                  )}
                </div>
              )}

              {msg && (
                <p className="muted" style={{ fontSize: '13px', marginTop: '10px' }}>
                  {msg}
                </p>
              )}
            </div>

            <div className="lesson-modal-f">
              <span className="muted" style={{ fontSize: '12.5px' }}>
                {form.type === 'video'
                  ? form.video_source === 'youtube'
                    ? 'Cole a URL do YouTube. Auto-resume e salvamento automático a cada 30s.'
                    : 'Cole o ID, link ou iframe do Vimeo.'
                  : 'Complete os campos principais da aula.'}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-ghost btn-sm" type="button" onClick={closeDialog}>
                  Cancelar
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  type="button"
                  onClick={() => {
                    void handleSave()
                  }}
                  disabled={saving}
                >
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
