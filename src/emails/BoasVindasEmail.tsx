import { Button, Heading, Text, Hr, Section } from '@react-email/components'
import { EmailLayout } from './EmailLayout'

interface BoasVindasEmailProps {
  name: string
  dashboardUrl: string
}

export function BoasVindasEmail({ name, dashboardUrl }: BoasVindasEmailProps) {
  return (
    <EmailLayout preview={`Bem-vindo(a) à Mentoria Fábio Borges, ${name}!`}>
      {/* Hero */}
      <Section style={hero}>
        <Text style={emoji}>🎉</Text>
        <Heading style={h1}>Bem-vindo(a), {name}!</Heading>
        <Text style={heroSub}>Sua conta está ativa e pronta para uso.</Text>
      </Section>

      <Text style={text}>
        Estamos felizes em ter você na plataforma da <strong>Mentoria Fábio Borges</strong>. Aqui
        você encontrará cursos práticos de estética avançada, micropigmentação e gestão para
        transformar sua carreira.
      </Text>

      <Text style={text}>
        Acesse sua área do aluno para explorar os cursos disponíveis e dar o primeiro passo na sua
        jornada de aprendizado.
      </Text>

      <Section style={{ textAlign: 'center' as const, margin: '28px 0' }}>
        <Button href={dashboardUrl} style={button}>
          Acessar minha área →
        </Button>
      </Section>

      <Hr style={divider} />

      {/* Steps */}
      <Text style={stepsTitle}>O que fazer agora?</Text>
      <table cellPadding={0} cellSpacing={0} style={{ width: '100%' }}>
        <tbody>
          {[
            {
              icon: '📚',
              label: 'Explore o catálogo',
              desc: 'Veja todos os cursos disponíveis para o seu plano.',
            },
            {
              icon: '▶️',
              label: 'Comece uma aula',
              desc: 'Acesse a primeira aula gratuita de qualquer curso.',
            },
            {
              icon: '🏆',
              label: 'Conquiste seu certificado',
              desc: 'Complete o curso e receba seu certificado digital.',
            },
          ].map((step) => (
            <tr key={step.label}>
              <td style={stepIcon}>{step.icon}</td>
              <td style={stepBody}>
                <Text style={stepLabel}>{step.label}</Text>
                <Text style={stepDesc}>{step.desc}</Text>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Hr style={divider} />
      <Text style={footer}>
        Se você não criou esta conta, ignore este e-mail. Nenhuma ação é necessária.
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

const stepsTitle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: '700',
  color: '#64748b',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  margin: '0 0 14px',
}

const stepIcon: React.CSSProperties = {
  fontSize: '20px',
  paddingRight: '12px',
  paddingBottom: '12px',
  verticalAlign: 'top',
  width: '32px',
}

const stepBody: React.CSSProperties = {
  paddingBottom: '12px',
  verticalAlign: 'top',
}

const stepLabel: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#1e293b',
  margin: '0 0 2px',
}

const stepDesc: React.CSSProperties = {
  fontSize: '13px',
  color: '#64748b',
  margin: '0',
}

const footer: React.CSSProperties = {
  fontSize: '12px',
  color: '#94a3b8',
  margin: '0',
}
