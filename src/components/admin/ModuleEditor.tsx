'use client'

import { useState } from 'react'
import { LessonEditor, type LessonRow } from './LessonEditor'

export interface ModuleRow {
  id: string
  course_id: string
  title: string
  order: number
  is_free_preview: boolean
  lessons: LessonRow[]
}

interface ModuleEditorProps {
  courseId: string
  modules: ModuleRow[]
  onModulesChange: (modules: ModuleRow[]) => void
}

export function ModuleEditor({ courseId, modules, onModulesChange }: ModuleEditorProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [showModuleDialog, setShowModuleDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function openCreateModule() {
    setEditingId(null)
    setNewTitle('')
    setMsg('')
    setShowModuleDialog(true)
  }

  function openEditModule(module: ModuleRow) {
    setEditingId(module.id)
    setEditTitle(module.title)
    setMsg('')
    setShowModuleDialog(true)
  }

  function closeModuleDialog() {
    setShowModuleDialog(false)
    setEditingId(null)
    setEditTitle('')
    setNewTitle('')
    setMsg('')
  }

  async function handleAddModule() {
    if (!newTitle.trim()) {
      setMsg('Titulo obrigatorio')
      return
    }
    setSaving(true)
    setMsg('')
    try {
      const maxOrder = modules.length > 0 ? Math.max(...modules.map((m) => m.order)) + 1 : 0
      const res = await fetch(`/api/admin/courses/${courseId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim(), order: maxOrder }),
      })
      const data = (await res.json()) as ModuleRow & { error?: string }
      if (!res.ok) {
        setMsg(`Erro: ${data.error ?? 'falha'}`)
        return
      }
      onModulesChange([...modules, { ...data, lessons: [] }])
      closeModuleDialog()
    } catch {
      setMsg('Erro de conexao')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveEdit(id: string) {
    if (!editTitle.trim()) {
      setMsg('Titulo obrigatorio')
      return
    }
    setSaving(true)
    setMsg('')
    try {
      const res = await fetch(`/api/admin/modules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle.trim() }),
      })
      const data = (await res.json()) as { title?: string; error?: string }
      if (!res.ok) {
        setMsg(`Erro: ${data.error ?? 'falha'}`)
        return
      }
      onModulesChange(
        modules.map((m) => (m.id === id ? { ...m, title: data.title ?? m.title } : m))
      )
      closeModuleDialog()
    } catch {
      setMsg('Erro de conexao')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(module: ModuleRow) {
    if (!confirm(`Deletar modulo "${module.title}"? Todas as aulas serao removidas.`)) return
    const res = await fetch(`/api/admin/modules/${module.id}`, { method: 'DELETE' })
    if (res.ok) onModulesChange(modules.filter((item) => item.id !== module.id))
  }

  async function handleTogglePreview(module: ModuleRow) {
    const res = await fetch(`/api/admin/modules/${module.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_free_preview: !module.is_free_preview }),
    })
    if (res.ok) {
      onModulesChange(
        modules.map((item) =>
          item.id === module.id ? { ...item, is_free_preview: !item.is_free_preview } : item
        )
      )
    }
  }

  async function handleReorder(idx: number, dir: -1 | 1) {
    const sortedModules = [...modules].sort((a, b) => a.order - b.order)
    const targetIdx = idx + dir
    if (targetIdx < 0 || targetIdx >= sortedModules.length) return
    const current = sortedModules[idx]
    const target = sortedModules[targetIdx]

    await Promise.all([
      fetch(`/api/admin/modules/${current.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: target.order }),
      }),
      fetch(`/api/admin/modules/${target.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: current.order }),
      }),
    ])

    onModulesChange(
      modules.map((module) => {
        if (module.id === current.id) return { ...module, order: target.order }
        if (module.id === target.id) return { ...module, order: current.order }
        return module
      })
    )
  }

  const sorted = [...modules].sort((a, b) => a.order - b.order)
  const dialogTitle = editingId ? 'Renomear modulo' : 'Novo modulo'
  const titleValue = editingId ? editTitle : newTitle

  return (
    <div style={{ marginTop: '18px' }}>
      <style>{`
        .mod-card{ border:1px solid var(--line); border-radius:12px; margin-bottom:10px; background:#fff; overflow:hidden; transition:border-color .15s, box-shadow .15s; }
        .mod-card:hover{ border-color:#c5d5e8; }
        .mod-card.expanded{ border-color:var(--blue); box-shadow:0 0 0 3px rgba(72,161,254,.1); }
        .mod-header{ display:flex; align-items:center; gap:10px; padding:13px 14px; cursor:pointer; user-select:none; }
        .mod-chevron{ width:28px; height:28px; border-radius:7px; border:1px solid var(--line); background:#fff; display:grid; place-items:center; flex-shrink:0; transition:all .2s; color:var(--muted); }
        .expanded .mod-chevron{ background:var(--blue); border-color:var(--blue); color:#fff; }
        .mod-title{ flex:1; font-weight:700; font-size:14px; color:var(--ink); min-width:0; }
        .mod-meta{ font-size:11.5px; color:var(--muted); flex-shrink:0; }
        .mod-actions{ display:flex; align-items:center; gap:4px; flex-shrink:0; }
        .mod-act-btn{ display:flex; align-items:center; gap:5px; height:34px; padding:0 11px; border-radius:8px; border:1px solid var(--line); background:#fff; font-size:12px; font-weight:600; color:var(--ink-2); cursor:pointer; transition:all .15s; white-space:nowrap; }
        .mod-act-btn:hover{ background:var(--surface-2); border-color:#b5c5d8; color:var(--ink); }
        .mod-act-btn:disabled{ opacity:.3; cursor:not-allowed; }
        .mod-act-btn.preview-on{ background:#e8f5e9; border-color:#a5d6a7; color:#2e7d32; }
        .mod-act-btn.danger{ color:#c53030; border-color:#fed7d7; background:#fff5f5; }
        .mod-act-btn.danger:hover{ background:#fed7d7; }
        .mod-act-icon{ width:34px; height:34px; border-radius:8px; border:1px solid var(--line); background:#fff; display:grid; place-items:center; cursor:pointer; color:var(--muted); transition:all .15s; flex-shrink:0; }
        .mod-act-icon:hover{ background:var(--surface-2); color:var(--ink); border-color:#b5c5d8; }
        .mod-act-icon:disabled{ opacity:.3; cursor:not-allowed; }
        .mod-sep{ width:1px; height:22px; background:var(--line); margin:0 2px; flex-shrink:0; }
        .mod-body{ border-top:1px solid var(--line); padding:12px 14px; background:var(--surface-2,#f8f9fa); }
        .admin-modal-backdrop{ position:fixed; inset:0; z-index:80; background:rgba(15,16,20,.48); display:grid; place-items:center; padding:18px; }
        .admin-modal{ width:min(560px,100%); max-height:calc(100vh - 36px); overflow:auto; background:#fff; border:1px solid var(--line); border-radius:12px; box-shadow:0 18px 60px rgba(0,0,0,.24); }
        .admin-modal-h{ display:flex; justify-content:space-between; align-items:flex-start; gap:14px; padding:18px 20px 12px; border-bottom:1px solid var(--line); }
        .admin-modal-h h3{ font-size:17px; margin:0; }
        .admin-modal-b{ padding:18px 20px; }
        .admin-modal-f{ display:flex; justify-content:flex-end; align-items:center; gap:8px; padding:14px 20px 18px; border-top:1px solid var(--line); }
        @media(max-width:700px){ .mod-act-btn span{ display:none; } }
      `}</style>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
        }}
      >
        <label style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--ink-2)' }}>
          Conteúdo ({sorted.length} módulo{sorted.length !== 1 ? 's' : ''})
        </label>
        <button className="btn btn-primary btn-sm" onClick={openCreateModule}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Adicionar módulo
        </button>
      </div>

      {sorted.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '28px 0',
            color: 'var(--muted)',
            fontSize: '14px',
            border: '1px dashed var(--line)',
            borderRadius: '12px',
          }}
        >
          Nenhum módulo cadastrado ainda. Clique em &quot;Adicionar módulo&quot; para começar.
        </div>
      )}

      {sorted.map((module, i) => {
        const isExpanded = expandedIds.has(module.id)
        return (
          <div key={module.id} className={`mod-card${isExpanded ? ' expanded' : ''}`}>
            <div className="mod-header" onClick={() => toggleExpand(module.id)}>
              {/* Chevron */}
              <div className="mod-chevron">
                {isExpanded ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M18 15l-6-6-6 6" />
                  </svg>
                ) : (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                )}
              </div>

              <div className="mod-title">
                <span
                  style={{
                    color: 'var(--muted)',
                    fontWeight: 500,
                    marginRight: '6px',
                    fontSize: '12px',
                  }}
                >
                  {i + 1}.
                </span>
                {module.title}
              </div>

              <span className="mod-meta">
                {module.lessons.length} aula{module.lessons.length !== 1 ? 's' : ''}
              </span>

              {module.is_free_preview && (
                <span
                  style={{
                    background: '#e8f5e9',
                    color: '#2e7d32',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    flexShrink: 0,
                  }}
                >
                  Preview
                </span>
              )}

              {/* Ações — stopPropagation para não colapsar o módulo */}
              <div className="mod-actions" onClick={(e) => e.stopPropagation()}>
                {/* Reordenar */}
                <button
                  className="mod-act-icon"
                  onClick={() => handleReorder(i, -1)}
                  disabled={i === 0}
                  title="Mover para cima"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M18 15l-6-6-6 6" />
                  </svg>
                </button>
                <button
                  className="mod-act-icon"
                  onClick={() => handleReorder(i, 1)}
                  disabled={i === sorted.length - 1}
                  title="Mover para baixo"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                <div className="mod-sep" />

                {/* Renomear */}
                <button
                  className="mod-act-btn"
                  onClick={() => openEditModule(module)}
                  title="Renomear módulo"
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
                  <span>Renomear</span>
                </button>

                {/* Preview toggle */}
                <button
                  className={`mod-act-btn${module.is_free_preview ? ' preview-on' : ''}`}
                  onClick={() => void handleTogglePreview(module)}
                  title="Alternar preview gratuito"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <span>{module.is_free_preview ? 'Preview: On' : 'Preview: Off'}</span>
                </button>

                <div className="mod-sep" />

                {/* Excluir */}
                <button
                  className="mod-act-btn danger"
                  onClick={() => void handleDelete(module)}
                  title="Excluir módulo"
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
                  <span>Excluir</span>
                </button>
              </div>
            </div>

            {isExpanded && (
              <div className="mod-body">
                <LessonEditor
                  lessons={module.lessons}
                  moduleId={module.id}
                  onLessonsChange={(newLessons) =>
                    onModulesChange(
                      modules.map((item) =>
                        item.id === module.id ? { ...item, lessons: newLessons } : item
                      )
                    )
                  }
                />
              </div>
            )}
          </div>
        )
      })}

      {showModuleDialog && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <div className="admin-modal">
            <div className="admin-modal-h">
              <div>
                <h3>{dialogTitle}</h3>
                <p className="muted" style={{ fontSize: '13px', marginTop: '4px' }}>
                  {editingId
                    ? 'Atualize o nome exibido no curriculo.'
                    : 'Crie uma secao para organizar as aulas.'}
                </p>
              </div>
              <button
                className="mod-act-icon"
                type="button"
                onClick={closeModuleDialog}
                title="Fechar"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="admin-modal-b">
              <div className="field">
                <label>Titulo do modulo</label>
                <input
                  className="input"
                  placeholder="Ex: Fundamentos"
                  value={titleValue}
                  onChange={(event) =>
                    editingId ? setEditTitle(event.target.value) : setNewTitle(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter')
                      editingId ? void handleSaveEdit(editingId) : void handleAddModule()
                    if (event.key === 'Escape') closeModuleDialog()
                  }}
                  autoFocus
                />
              </div>
              {msg && (
                <p className="muted" style={{ fontSize: '13px', marginTop: '8px' }}>
                  {msg}
                </p>
              )}
            </div>
            <div className="admin-modal-f">
              <button className="btn btn-ghost btn-sm" type="button" onClick={closeModuleDialog}>
                Cancelar
              </button>
              <button
                className="btn btn-primary btn-sm"
                type="button"
                onClick={() =>
                  editingId ? void handleSaveEdit(editingId) : void handleAddModule()
                }
                disabled={saving}
              >
                {saving ? 'Salvando...' : editingId ? 'Salvar' : 'Criar modulo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
