import { Button, Heading, Text, Hr, Section } from '@react-email/components'
import { EmailLayout } from './EmailLayout'

interface InativoLembreteEmailProps {
  name: string
  days: number
  dashboardUrl: string
}

export function InativoLembreteEmail({ name, days, dashboardUrl }: InativoLembreteEmailProps) {
  const urgency = days >= 30 ? 'high' : days >= 14 ? 'medium' : 'low'

  const messages: Record<string, { emoji: string; heading: string; body: string }> = {
    low: {
      emoji: '👋',
      heading: `${name}, seus cursos estão com saudade!`,
      body: `Faz ${days} dias que você não acessa a plataforma. Que tal continuar de onde parou? Cada aula é um passo a mais na sua jornada profissional.`,
    },
    medium: {
      emoji: '⏰',
      heading: `${name}, não perca seu ritmo!`,
      body: `Já faz ${days} dias sem acessar a Mentoria Fábio Borges. O aprendizado constante é o que diferencia os melhores profissionais — volte e retome seu progresso.`,
    },
    high: {
      emoji: '🚀',
      heading: `${name}, está na hora de voltar!`,
      body: `Faz ${days} dias que você está ausente. Seus cursos continuam esperando por você — invista no seu desenvolvimento e volte a evoluir na sua carreira estética.`,
    },
  }

  const msg = messages[urgency]

  return (
    <EmailLayout
      preview={`Faz ${days} dias que você não acessa a Mentoria — continue de onde parou!`}
    >
      {/* Hero */}
      <Section style={hero}>
        <Text style={emoji}>{msg.emoji}</Text>
        <Heading style={h1}>{msg.heading}</Heading>
      </Section>

      {/* Days badge */}
      <Section style={daysBadge}>
        <Text style={daysBadgeNumber}>{days}</Text>
        <Text style={daysBadgeLabel}>dias sem acessar</Text>
      </Section>

      <Text style={text}>{msg.body}</Text>

      <Section style={{ textAlign: 'center' as const, margin: '28px 0' }}>
        <Button href={dashboardUrl} style={button}>
          Retomar meus estudos →
        </Button>
      </Section>

      <Hr style={divider} />

      <table cellPadding={0} cellSpacing={0} style={{ width: '100%' }}>
        <tbody>
          {[
            { icon: '📱', text: 'Acesse de qualquer dispositivo, a qualquer hora' },
            { icon: '🎯', text: 'Continue do ponto exato onde parou' },
            { icon: '📜', text: 'Certificado digital ao concluir cada curso' },
          ].map((item) => (
            <tr key={item.text}>
              <td style={featureIcon}>{item.icon}</td>
              <td style={featureText}>{item.text}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Hr style={divider} />
      <Text style={footer}>
        Para não receber mais estes lembretes, acesse as configurações da sua conta.
      </Text>
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

const emoji: React.CSSProperties = {
  fontSize: '40px',
  margin: '0 0 8px',
  lineHeight: '1',
}

const h1: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: '700',
  color: '#0f172a',
  margin: '0',
  letterSpacing: '-0.02em',
  lineHeight: '1.3',
}

const daysBadge: React.CSSProperties = {
  backgroundColor: '#fff7ed',
  border: '1px solid #fed7aa',
  borderRadius: '10px',
  padding: '14px 20px',
  marginBottom: '20px',
  textAlign: 'center' as const,
}

const daysBadgeNumber: React.CSSProperties = {
  fontSize: '42px',
  fontWeight: '800',
  color: '#ea580c',
  margin: '0',
  lineHeight: '1',
  letterSpacing: '-0.04em',
}

const daysBadgeLabel: React.CSSProperties = {
  fontSize: '13px',
  color: '#9a3412',
  margin: '4px 0 0',
  fontWeight: '600',
}

const text: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '1.65',
  color: '#334155',
  margin: '0 0 16px',
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

const featureIcon: React.CSSProperties = {
  fontSize: '16px',
  paddingRight: '10px',
  paddingBottom: '10px',
  verticalAlign: 'middle',
  width: '28px',
}

const featureText: React.CSSProperties = {
  fontSize: '14px',
  color: '#334155',
  paddingBottom: '10px',
  verticalAlign: 'middle',
}

const footer: React.CSSProperties = {
  fontSize: '12px',
  color: '#94a3b8',
  margin: '0',
}
