import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Hr,
  Button,
} from '@react-email/components'

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
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>{`Sua tarefa "${assignmentTitle}" foi corrigida — nota ${grade}/100`}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>Tarefa corrigida!</Heading>
          <Text style={text}>
            Olá, <strong>{name}</strong>. Sua tarefa <strong>&quot;{assignmentTitle}&quot;</strong> foi
            avaliada pelo mentor.
          </Text>

          <div style={scoreBox}>
            <Text style={scoreLabel}>Sua nota</Text>
            <Text style={scoreValue}>{grade}/100</Text>
          </div>

          {feedback && (
            <>
              <Text style={feedbackLabel}>Feedback do mentor</Text>
              <Text style={feedbackText}>{feedback}</Text>
            </>
          )}

          <Button href={dashboardUrl} style={button}>
            Acessar minha área
          </Button>

          <Hr style={hr} />
          <Text style={footer}>Mentoria Fábio Borges</Text>
        </Container>
      </Body>
    </Html>
  )
}

const body = { backgroundColor: '#f9fafb', fontFamily: 'sans-serif' }

const container = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '32px 24px',
  backgroundColor: '#ffffff',
  borderRadius: '12px',
}

const h1 = { fontSize: '24px', fontWeight: '700', color: '#111827', margin: '0 0 16px' }

const text = { fontSize: '15px', lineHeight: '1.6', color: '#374151', margin: '0 0 16px' }

const scoreBox = {
  backgroundColor: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '0 0 20px',
}

const scoreLabel = { fontSize: '12px', fontWeight: '600', color: '#16a34a', margin: '0 0 4px', textTransform: 'uppercase' as const }

const scoreValue = { fontSize: '32px', fontWeight: '700', color: '#111827', margin: '0' }

const feedbackLabel = { fontSize: '13px', fontWeight: '600', color: '#374151', margin: '0 0 6px' }

const feedbackText = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#4b5563',
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  padding: '12px 16px',
  margin: '0 0 20px',
}

const button = {
  backgroundColor: '#4f46e5',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '8px',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  display: 'inline-block',
}

const hr = { borderColor: '#e5e7eb', margin: '24px 0' }

const footer = { fontSize: '12px', color: '#9ca3af', margin: '0' }
