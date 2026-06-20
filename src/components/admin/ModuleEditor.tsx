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
      onModulesChange(modules.map((m) => (m.id === id ? { ...m, title: data.title ?? m.title } : m)))
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
        .mod-header{ display:flex; align-items:center; gap:10px; padding:11px 14px; border:1px solid var(--line); border-radius:11px; margin-bottom:4px; background:#fff; }
        .mod-header:hover{ border-color:var(--blue); }
        .mod-header.expanded{ border-color:var(--blue); border-bottom-left-radius:0; border-bottom-right-radius:0; border-bottom-color:var(--line); }
        .mod-body{ border:1px solid var(--line); border-top:none; border-bottom-left-radius:11px; border-bottom-right-radius:11px; padding:10px 12px; margin-bottom:8px; background:var(--surface-2,#f8f9fa); }
        .iconbtn-xs{ width:26px; height:26px; border-radius:7px; border:1px solid var(--line-2); background:#fff; display:grid; place-items:center; cursor:pointer; font-size:12px; color:var(--muted); }
        .iconbtn-xs:hover{ background:var(--surface-2); color:var(--ink); }
        .iconbtn-xs:disabled{ opacity:.35; cursor:not-allowed; }
        .admin-modal-backdrop{ position:fixed; inset:0; z-index:80; background:rgba(15,16,20,.48); display:grid; place-items:center; padding:18px; }
        .admin-modal{ width:min(560px,100%); max-height:calc(100vh - 36px); overflow:auto; background:#fff; border:1px solid var(--line); border-radius:12px; box-shadow:0 18px 60px rgba(0,0,0,.24); }
        .admin-modal-h{ display:flex; justify-content:space-between; align-items:flex-start; gap:14px; padding:18px 20px 12px; border-bottom:1px solid var(--line); }
        .admin-modal-h h3{ font-size:17px; margin:0; }
        .admin-modal-b{ padding:18px 20px; }
        .admin-modal-f{ display:flex; justify-content:flex-end; align-items:center; gap:8px; padding:14px 20px 18px; border-top:1px solid var(--line); }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-2)' }}>
          Conteudo do curso ({sorted.length} modulo{sorted.length !== 1 ? 's' : ''})
        </label>
        <button className="btn btn-ghost btn-sm" style={{ fontSize: '12px' }} onClick={openCreateModule}>
          + Modulo
        </button>
      </div>

      {sorted.length === 0 && (
        <p className="muted" style={{ fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>
          Nenhum modulo cadastrado ainda.
        </p>
      )}

      {sorted.map((module, i) => {
        const isExpanded = expandedIds.has(module.id)
        return (
          <div key={module.id}>
            <div className={`mod-header${isExpanded ? ' expanded' : ''}`}>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--faint)', padding: '0 2px', flexShrink: 0 }}
                onClick={() => toggleExpand(module.id)}
                title={isExpanded ? 'Recolher' : 'Expandir'}
              >
                {isExpanded ? 'v' : '>'}
              </button>

              <span style={{ flex: 1, fontWeight: 600, fontSize: '13.5px', cursor: 'pointer' }} onClick={() => toggleExpand(module.id)}>
                {i + 1}. {module.title}
              </span>

              <span className="muted" style={{ fontSize: '11px', flexShrink: 0 }}>
                {module.lessons.length} aula{module.lessons.length !== 1 ? 's' : ''}
              </span>

              {module.is_free_preview && (
                <span className="badge" style={{ background: '#e8f5e9', color: '#2e7d32', fontSize: '10px', padding: '1px 6px', flexShrink: 0 }}>Preview</span>
              )}

              <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                <button className="iconbtn-xs" onClick={() => handleReorder(i, -1)} disabled={i === 0} title="Subir">↑</button>
                <button className="iconbtn-xs" onClick={() => handleReorder(i, 1)} disabled={i === sorted.length - 1} title="Descer">↓</button>
                <button className="iconbtn-xs" onClick={() => openEditModule(module)} title="Renomear">✎</button>
                <button className="iconbtn-xs" onClick={() => void handleTogglePreview(module)} title="Preview gratuito" style={{ fontSize: '10px' }}>
                  {module.is_free_preview ? 'On' : 'Off'}
                </button>
                <button className="iconbtn-xs" onClick={() => void handleDelete(module)} title="Deletar modulo" style={{ color: 'var(--red,#e53e3e)' }}>×</button>
              </div>
            </div>

            {isExpanded && (
              <div className="mod-body">
                <LessonEditor
                  lessons={module.lessons}
                  moduleId={module.id}
                  onLessonsChange={(newLessons) =>
                    onModulesChange(modules.map((item) => (item.id === module.id ? { ...item, lessons: newLessons } : item)))
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
                  {editingId ? 'Atualize o nome exibido no curriculo.' : 'Crie uma secao para organizar as aulas.'}
                </p>
              </div>
              <button className="iconbtn-xs" type="button" onClick={closeModuleDialog} title="Fechar">×</button>
            </div>
            <div className="admin-modal-b">
              <div className="field">
                <label>Titulo do modulo</label>
                <input
                  className="input"
                  placeholder="Ex: Fundamentos"
                  value={titleValue}
                  onChange={(event) => (editingId ? setEditTitle(event.target.value) : setNewTitle(event.target.value))}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') editingId ? void handleSaveEdit(editingId) : void handleAddModule()
                    if (event.key === 'Escape') closeModuleDialog()
                  }}
                  autoFocus
                />
              </div>
              {msg && <p className="muted" style={{ fontSize: '13px', marginTop: '8px' }}>{msg}</p>}
            </div>
            <div className="admin-modal-f">
              <button className="btn btn-ghost btn-sm" type="button" onClick={closeModuleDialog}>Cancelar</button>
              <button
                className="btn btn-primary btn-sm"
                type="button"
                onClick={() => (editingId ? void handleSaveEdit(editingId) : void handleAddModule())}
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
