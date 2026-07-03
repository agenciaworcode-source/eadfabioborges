import { Button, Heading, Text, Hr, Section } from '@react-email/components'
import { EmailLayout } from './EmailLayout'

interface TarefaCorrigidaEmailProps {
  name: string
  assignmentTitle: string
  grade: number
  feedback: string
  dashboardUrl: string
}

export function TarefaCorrigidaEmail({
  name,
  assignmentTitle,
  grade,
  feedback,
  dashboardUrl,
}: TarefaCorrigidaEmailProps) {
  const passed = grade >= 70
  const gradeColor = grade >= 90 ? '#16a34a' : grade >= 70 ? '#2563eb' : '#dc2626'
  const gradeBg = grade >= 90 ? '#f0fdf4' : grade >= 70 ? '#eff6ff' : '#fef2f2'
  const gradeBorder = grade >= 90 ? '#bbf7d0' : grade >= 70 ? '#bfdbfe' : '#fecaca'

  return (
    <EmailLayout preview={`Sua tarefa "${assignmentTitle}" foi corrigida — nota ${grade}/100`}>
      {/* Hero */}
      <Section style={hero}>
        <Text style={emojiStyle}>{passed ? '✅' : '📝'}</Text>
        <Heading style={h1}>Tarefa corrigida!</Heading>
        <Text style={heroSub}>Olá, {name}. O mentor avaliou sua entrega.</Text>
      </Section>

      {/* Assignment name */}
      <Section style={assignmentBox}>
        <Text style={assignmentLabel}>Tarefa avaliada</Text>
        <Text style={assignmentName}>&quot;{assignmentTitle}&quot;</Text>
      </Section>

      {/* Grade */}
      <Section
        style={{ ...gradeBox, backgroundColor: gradeBg, border: `1px solid ${gradeBorder}` }}
      >
        <table cellPadding={0} cellSpacing={0} style={{ width: '100%' }}>
          <tbody>
            <tr>
              <td>
                <Text style={gradeLabel}>Sua nota</Text>
                <Text style={{ ...gradeValue, color: gradeColor }}>{grade}/100</Text>
              </td>
              <td style={{ textAlign: 'right' as const, verticalAlign: 'middle' }}>
                <Text style={{ ...gradeBadge, backgroundColor: gradeColor }}>
                  {grade >= 90 ? 'Excelente' : grade >= 70 ? 'Aprovado' : 'Recuperação'}
                </Text>
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      {/* Feedback */}
      {feedback && (
        <>
          <Text style={feedbackLabel}>Feedback do mentor</Text>
          <Section style={feedbackBox}>
            <Text style={feedbackText}>{feedback}</Text>
          </Section>
        </>
      )}

      <Section style={{ textAlign: 'center' as const, margin: '28px 0' }}>
        <Button href={dashboardUrl} style={button}>
          Acessar minha área →
        </Button>
      </Section>

      <Hr style={divider} />
      <Text style={footer}>Mentoria Fábio Borges</Text>
    </EmailLayout>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const hero: React.CSSProperties = {
  textAlign: 'center' as const,
  padding: '0 0 24px',
  borderBottom: '1px solid #f1f5f9',
  marginBottom: '24px',
}

const emojiStyle: React.CSSProperties = {
  fontSize: '40px',
  margin: '0 0 8px',
  lineHeight: '1',
}

const h1: React.CSSProperties = {
  fontSize: '26px',
  fontWeight: '700',
  color: '#0f172a',
  margin: '0 0 6px',
  letterSpacing: '-0.03em',
}

const heroSub: React.CSSProperties = {
  fontSize: '15px',
  color: '#64748b',
  margin: '0',
}

const assignmentBox: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '14px 18px',
  marginBottom: '16px',
}

const assignmentLabel: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: '700',
  color: '#64748b',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  margin: '0 0 4px',
}

const assignmentName: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: '600',
  color: '#1e293b',
  margin: '0',
}

const gradeBox: React.CSSProperties = {
  borderRadius: '10px',
  padding: '16px 20px',
  marginBottom: '20px',
}

const gradeLabel: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#64748b',
  margin: '0 0 4px',
}

const gradeValue: React.CSSProperties = {
  fontSize: '38px',
  fontWeight: '800',
  margin: '0',
  lineHeight: '1',
  letterSpacing: '-0.04em',
}

const gradeBadge: React.CSSProperties = {
  display: 'inline-block',
  color: '#ffffff',
  fontSize: '12px',
  fontWeight: '700',
  padding: '5px 12px',
  borderRadius: '980px',
}

const feedbackLabel: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: '700',
  color: '#374151',
  margin: '0 0 8px',
}

const feedbackBox: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderLeft: '3px solid #4f46e5',
  borderRadius: '6px',
  padding: '14px 16px',
  marginBottom: '20px',
}

const feedbackText: React.CSSProperties = {
  fontSize: '14px',
  lineHeight: '1.65',
  color: '#374151',
  margin: '0',
}

const button: React.CSSProperties = {
  backgroundColor: '#4f46e5',
  color: '#ffffff',
  padding: '14px 32px',
  borderRadius: '8px',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  display: 'inline-block',
}

const divider: React.CSSProperties = {
  borderColor: '#f1f5f9',
  margin: '24px 0',
}

const footer: React.CSSProperties = {
  fontSize: '12px',
  color: '#94a3b8',
  margin: '0',
}
