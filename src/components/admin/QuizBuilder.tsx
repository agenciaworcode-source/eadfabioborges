'use client'

import { useState, useEffect } from 'react'
import { QuestionForm, type QuestionRow, type QuestionDraft } from './QuestionForm'

interface Quiz {
  id: string
  lesson_id: string | null
  course_id?: string | null
  scope?: 'lesson' | 'course'
  title: string
  pass_score: number
  attempts_allowed: number
  questions: QuestionRow[]
}

interface QuizBuilderProps {
  lessonId?: string
  courseId?: string
  lessonTitle?: string
  courseTitle?: string
  targetType?: 'lesson' | 'course'
  onClose: () => void
}

const emptyDraft = (): QuestionDraft => ({
  type: 'multiple_choice',
  body: '',
  options: ['', '', '', ''],
  correct_answer: '',
})

export function QuizBuilder({
  lessonId,
  courseId,
  lessonTitle,
  courseTitle,
  targetType = 'lesson',
  onClose,
}: QuizBuilderProps) {
  const [quiz, setQuiz] = useState<Quiz | null | undefined>(undefined) // undefined = loading
  const [createForm, setCreateForm] = useState({ title: '', pass_score: '70', attempts_allowed: '3' })
  const [settingsForm, setSettingsForm] = useState({ title: '', pass_score: '70', attempts_allowed: '3' })
  const [creatingQuiz, setCreatingQuiz] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsMsg, setSettingsMsg] = useState('')
  const [quizMsg, setQuizMsg] = useState('')
  const [showAddQ, setShowAddQ] = useState(false)
  const [editingQId, setEditingQId] = useState<string | null>(null)
  const [qDraft, setQDraft] = useState<QuestionDraft>(emptyDraft())
  const [savingQ, setSavingQ] = useState(false)
  const [qMsg, setQMsg] = useState('')
  const targetId = targetType === 'course' ? courseId : lessonId
  const targetLabel = targetType === 'course' ? (courseTitle ?? 'Curso') : (lessonTitle ?? 'Aula')
  const endpoint = targetType === 'course'
    ? `/api/admin/courses/${courseId}/quiz`
    : `/api/admin/lessons/${lessonId}/quiz`

  useEffect(() => {
    if (targetId) void fetchQuiz()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId, targetType])

  async function fetchQuiz() {
    if (!targetId) return
    setQuiz(undefined)
    const res = await fetch(endpoint)
    const data = await res.json() as Quiz | null
    setQuiz(data)
    if (data) {
      setSettingsForm({
        title: data.title,
        pass_score: String(data.pass_score),
        attempts_allowed: String(data.attempts_allowed),
      })
    }
  }

  async function handleCreateQuiz() {
    if (!createForm.title.trim()) { setQuizMsg('Título obrigatório'); return }
    setCreatingQuiz(true); setQuizMsg('')
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: createForm.title.trim(),
          pass_score: parseInt(createForm.pass_score) || 70,
          attempts_allowed: parseInt(createForm.attempts_allowed) || 3,
        }),
      })
      const data = await res.json() as Quiz & { error?: string }
      if (!res.ok) { setQuizMsg(`Erro: ${data.error ?? 'falha'}`); return }
      setQuiz({ ...data, questions: [] })
      setSettingsForm({
        title: data.title,
        pass_score: String(data.pass_score),
        attempts_allowed: String(data.attempts_allowed),
      })
    } catch { setQuizMsg('Erro de conexão') }
    finally { setCreatingQuiz(false) }
  }

  async function handleSaveSettings() {
    if (!quiz) return
    if (!settingsForm.title.trim()) { setSettingsMsg('Título obrigatório'); return }
    setSavingSettings(true)
    setSettingsMsg('')
    try {
      const res = await fetch(`/api/admin/quizzes/${quiz.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: settingsForm.title.trim(),
          pass_score: parseInt(settingsForm.pass_score, 10) || 70,
          attempts_allowed: parseInt(settingsForm.attempts_allowed, 10) || 1,
        }),
      })
      const data = await res.json() as Partial<Quiz> & { error?: string }
      if (!res.ok) {
        setSettingsMsg(`Erro: ${data.error ?? 'falha ao salvar'}`)
        return
      }
      setQuiz({
        ...quiz,
        title: data.title ?? quiz.title,
        pass_score: data.pass_score ?? quiz.pass_score,
        attempts_allowed: data.attempts_allowed ?? quiz.attempts_allowed,
      })
      setSettingsMsg('Configurações salvas.')
    } catch {
      setSettingsMsg('Erro de conexão')
    } finally {
      setSavingSettings(false)
    }
  }

  async function handleDeleteQuiz() {
    if (!quiz) return
    if (!confirm(`Deletar quiz "${quiz.title}"? Todas as questões serão removidas.`)) return
    await fetch(`/api/admin/quizzes/${quiz.id}`, { method: 'DELETE' })
    setQuiz(null)
  }

  function openAddQuestion() {
    setEditingQId(null)
    setQDraft(emptyDraft())
    setShowAddQ(true)
    setQMsg('')
  }

  function openEditQuestion(q: QuestionRow) {
    setEditingQId(q.id)
    setQDraft({ type: q.type, body: q.body, options: q.options ?? [], correct_answer: q.correct_answer })
    setShowAddQ(true)
    setQMsg('')
  }

  async function handleSaveQuestion() {
    if (!quiz) return
    if (!qDraft.body.trim()) { setQMsg('Enunciado obrigatório'); return }
    setSavingQ(true); setQMsg('')
    try {
      if (editingQId) {
        const res = await fetch(`/api/admin/questions/${editingQId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(qDraft),
        })
        const data = await res.json() as QuestionRow & { error?: string }
        if (!res.ok) { setQMsg(`Erro: ${data.error ?? 'falha'}`); return }
        setQuiz({ ...quiz, questions: quiz.questions.map(q => q.id === editingQId ? data : q) })
        setShowAddQ(false); setEditingQId(null)
      } else {
        const res = await fetch(`/api/admin/quizzes/${quiz.id}/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(qDraft),
        })
        const data = await res.json() as QuestionRow & { error?: string }
        if (!res.ok) { setQMsg(`Erro: ${data.error ?? 'falha'}`); return }
        setQuiz({ ...quiz, questions: [...quiz.questions, data] })
        setShowAddQ(false)
      }
    } catch { setQMsg('Erro de conexão') }
    finally { setSavingQ(false) }
  }

  async function handleDeleteQuestion(q: QuestionRow) {
    if (!quiz) return
    if (!confirm(`Deletar questão?`)) return
    const res = await fetch(`/api/admin/questions/${q.id}`, { method: 'DELETE' })
    if (res.ok) setQuiz({ ...quiz, questions: quiz.questions.filter(x => x.id !== q.id) })
  }

  const typeLabel = (t: string) =>
    t === 'multiple_choice' ? 'Múltipla' : t === 'true_false' ? 'V/F' : 'Dissertativa'

  return (
    <div style={{ border: '1px solid var(--blue)', borderRadius: '12px', padding: '16px', marginTop: '10px', background: '#f0f7ff' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: '13.5px' }}>Quiz</span>
          <span className="muted" style={{ fontSize: '12px', marginLeft: '8px' }}>{targetLabel}</span>
          {targetType === 'course' && (
            <span className="badge blue" style={{ fontSize: '10px', marginLeft: '8px', padding: '2px 7px' }}>Geral do curso</span>
          )}
        </div>
        <button
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'var(--muted)', padding: '2px 6px' }}
          onClick={onClose}
          title="Fechar"
        >
          ✕
        </button>
      </div>

      {quiz === undefined && (
        <p className="muted" style={{ fontSize: '13px' }}>Carregando...</p>
      )}

      {quiz === null && (
        <div>
          <p className="muted" style={{ fontSize: '13px', marginBottom: '12px' }}>
            {targetType === 'course' ? 'Este curso nao tem quiz geral. Crie um agora:' : 'Esta aula nao tem quiz. Crie um agora:'}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px', gap: '8px', marginBottom: '10px' }}>
            <div className="field">
              <label style={{ fontSize: '12px' }}>Título do quiz</label>
              <input
                className="input"
                style={{ fontSize: '13px' }}
                placeholder={targetType === 'course' ? 'Ex: Prova final do curso' : 'Ex: Avaliacao modulo 1'}
                value={createForm.title}
                onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="field">
              <label style={{ fontSize: '12px' }}>% Aprovação</label>
              <input
                className="input"
                type="number"
                min="0"
                max="100"
                style={{ fontSize: '13px' }}
                value={createForm.pass_score}
                onChange={e => setCreateForm(f => ({ ...f, pass_score: e.target.value }))}
              />
            </div>
            <div className="field">
              <label style={{ fontSize: '12px' }}>Tentativas</label>
              <input
                className="input"
                type="number"
                min="1"
                style={{ fontSize: '13px' }}
                value={createForm.attempts_allowed}
                onChange={e => setCreateForm(f => ({ ...f, attempts_allowed: e.target.value }))}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button className="btn btn-primary btn-sm" onClick={() => void handleCreateQuiz()} disabled={creatingQuiz}>
              {creatingQuiz ? 'Criando...' : 'Criar quiz'}
            </button>
            {quizMsg && <span className="muted" style={{ fontSize: '12px' }}>{quizMsg}</span>}
          </div>
        </div>
      )}

      {quiz && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span style={{ fontWeight: 600, fontSize: '13px' }}>{quiz.title}</span>
            <span className="badge" style={{ background: '#e3f2fd', color: '#1565c0', fontSize: '11px' }}>
              {quiz.pass_score}% aprovação
            </span>
            <span className="badge" style={{ background: '#f3e5f5', color: '#6a1b9a', fontSize: '11px' }}>
              {quiz.attempts_allowed} tent.
            </span>
            <button
              className="iconbtn-xs"
              style={{ marginLeft: 'auto', color: 'var(--red,#e53e3e)' }}
              onClick={() => void handleDeleteQuiz()}
              title="Deletar quiz"
            >
              ✕
            </button>
          </div>

          <div style={{ border: '1px solid var(--line)', borderRadius: '10px', padding: '12px', background: '#fff', marginBottom: '12px' }}>
            <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>Configurações da avaliação</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px,1fr) 110px 110px auto', gap: '8px', alignItems: 'end' }}>
              <div className="field">
                <label style={{ fontSize: '12px' }}>Título</label>
                <input
                  className="input"
                  style={{ fontSize: '13px' }}
                  value={settingsForm.title}
                  onChange={(event) => setSettingsForm((value) => ({ ...value, title: event.target.value }))}
                />
              </div>
              <div className="field">
                <label style={{ fontSize: '12px' }}>% mínimo</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  max="100"
                  style={{ fontSize: '13px' }}
                  value={settingsForm.pass_score}
                  onChange={(event) => setSettingsForm((value) => ({ ...value, pass_score: event.target.value }))}
                />
              </div>
              <div className="field">
                <label style={{ fontSize: '12px' }}>Tentativas</label>
                <input
                  className="input"
                  type="number"
                  min="1"
                  style={{ fontSize: '13px' }}
                  value={settingsForm.attempts_allowed}
                  onChange={(event) => setSettingsForm((value) => ({ ...value, attempts_allowed: event.target.value }))}
                />
              </div>
              <button
                className="btn btn-primary btn-sm"
                type="button"
                onClick={() => void handleSaveSettings()}
                disabled={savingSettings}
              >
                {savingSettings ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
            {settingsMsg && (
              <p className={settingsMsg.startsWith('Erro') ? 'muted' : 'blue'} style={{ fontSize: '12px', marginTop: '8px' }}>
                {settingsMsg}
              </p>
            )}
          </div>

          {quiz.questions.length === 0 && !showAddQ && (
            <p className="muted" style={{ fontSize: '12px', marginBottom: '8px' }}>
              Nenhuma questão. Adicione a primeira:
            </p>
          )}

          {quiz.questions.map((q, i) => (
            <div
              key={q.id}
              style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '8px 10px', background: '#fff', border: '1px solid var(--line)', borderRadius: '8px', marginBottom: '6px', fontSize: '13px' }}
            >
              <span style={{ color: 'var(--faint)', fontSize: '11px', paddingTop: '2px', flexShrink: 0 }}>{i + 1}.</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 500 }}>{q.body}</span>
                <span className="badge" style={{ marginLeft: '8px', background: '#e8eaf6', color: '#283593', fontSize: '10px', padding: '1px 5px' }}>
                  {typeLabel(q.type)}
                </span>
                {q.correct_answer && (
                  <span className="muted" style={{ marginLeft: '6px', fontSize: '11px' }}>
                    ✓ {q.correct_answer === 'true' ? 'Verdadeiro' : q.correct_answer === 'false' ? 'Falso' : q.correct_answer}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                <button className="iconbtn-xs" onClick={() => openEditQuestion(q)} title="Editar">✎</button>
                <button className="iconbtn-xs" style={{ color: 'var(--red,#e53e3e)' }} onClick={() => void handleDeleteQuestion(q)} title="Deletar">✕</button>
              </div>
            </div>
          ))}

          {showAddQ && (
            <QuestionForm
              value={qDraft}
              onChange={setQDraft}
              saving={savingQ}
              msg={qMsg}
              onSave={() => void handleSaveQuestion()}
              onCancel={() => { setShowAddQ(false); setEditingQId(null); setQMsg('') }}
              isEdit={!!editingQId}
            />
          )}

          {!showAddQ && (
            <button className="btn btn-ghost btn-sm" style={{ fontSize: '12px', marginTop: '4px' }} onClick={openAddQuestion}>
              + Adicionar questão
            </button>
          )}
        </div>
      )}
    </div>
  )
}
