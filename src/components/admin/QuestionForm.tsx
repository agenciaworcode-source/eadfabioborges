'use client'

export type QuestionType = 'multiple_choice' | 'true_false' | 'open'

export interface QuestionRow {
  id: string
  quiz_id: string
  type: QuestionType
  body: string
  options: string[]
  correct_answer: string | null
}

export interface QuestionDraft {
  type: QuestionType
  body: string
  options: string[]
  correct_answer: string | null
}

interface QuestionFormProps {
  value: QuestionDraft
  onChange: (v: QuestionDraft) => void
  saving: boolean
  msg: string
  onSave: () => void
  onCancel: () => void
  isEdit: boolean
}

export function QuestionForm({ value, onChange, saving, msg, onSave, onCancel, isEdit }: QuestionFormProps) {
  function setType(t: QuestionType) {
    if (t === 'multiple_choice') {
      onChange({ ...value, type: t, options: ['', '', '', ''], correct_answer: '' })
    } else if (t === 'true_false') {
      onChange({ ...value, type: t, options: [], correct_answer: 'true' })
    } else {
      onChange({ ...value, type: t, options: [], correct_answer: null })
    }
  }

  return (
    <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--r)', padding: '14px', marginBottom: '8px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
        <div className="field">
          <label style={{ fontSize: '12px' }}>Tipo</label>
          <select
            className="input"
            style={{ fontSize: '13px' }}
            value={value.type}
            onChange={e => setType(e.target.value as QuestionType)}
          >
            <option value="multiple_choice">Múltipla escolha</option>
            <option value="true_false">Verdadeiro / Falso</option>
            <option value="open">Dissertativa</option>
          </select>
        </div>
        <div className="field">
          <label style={{ fontSize: '12px' }}>Enunciado *</label>
          <input
            className="input"
            style={{ fontSize: '13px' }}
            placeholder="Ex: Qual tecnologia usa ultrassom?"
            value={value.body}
            onChange={e => onChange({ ...value, body: e.target.value })}
          />
        </div>
      </div>

      {value.type === 'multiple_choice' && (
        <div style={{ marginBottom: '10px' }}>
          <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px', color: 'var(--ink-2)', fontWeight: 600 }}>
            Opções (A, B, C, D)
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--muted)', width: '16px', flexShrink: 0 }}>
                  {String.fromCharCode(65 + i)}.
                </span>
                <input
                  className="input"
                  style={{ fontSize: '13px', flex: 1 }}
                  placeholder={`Opção ${String.fromCharCode(65 + i)}`}
                  value={value.options[i] ?? ''}
                  onChange={e => {
                    const opts = [...value.options]
                    opts[i] = e.target.value
                    onChange({ ...value, options: opts })
                  }}
                />
              </div>
            ))}
          </div>
          <div className="field">
            <label style={{ fontSize: '12px' }}>Resposta correta</label>
            <select
              className="input"
              style={{ fontSize: '13px' }}
              value={value.correct_answer ?? ''}
              onChange={e => onChange({ ...value, correct_answer: e.target.value })}
            >
              <option value="">Selecione...</option>
              {value.options.map((opt, i) => opt.trim() && (
                <option key={i} value={opt}>{String.fromCharCode(65 + i)}. {opt}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {value.type === 'true_false' && (
        <div style={{ marginBottom: '10px' }}>
          <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px', color: 'var(--ink-2)', fontWeight: 600 }}>
            Resposta correta
          </label>
          <div style={{ display: 'flex', gap: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="tf_answer"
                value="true"
                checked={value.correct_answer === 'true'}
                onChange={() => onChange({ ...value, correct_answer: 'true' })}
              />
              Verdadeiro
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="tf_answer"
                value="false"
                checked={value.correct_answer === 'false'}
                onChange={() => onChange({ ...value, correct_answer: 'false' })}
              />
              Falso
            </label>
          </div>
        </div>
      )}

      {value.type === 'open' && (
        <p className="muted" style={{ fontSize: '12px', marginBottom: '10px' }}>
          Questão dissertativa — sem resposta automática. Correção manual.
        </p>
      )}

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button className="btn btn-primary btn-sm" onClick={onSave} disabled={saving}>
          {saving ? 'Salvando...' : isEdit ? 'Salvar' : 'Adicionar questão'}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancelar</button>
        {msg && <span className="muted" style={{ fontSize: '12px' }}>{msg}</span>}
      </div>
    </div>
  )
}
