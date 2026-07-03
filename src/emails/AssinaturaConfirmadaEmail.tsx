import { Button, Heading, Text, Hr, Section } from '@react-email/components'
import { EmailLayout } from './EmailLayout'

interface AssinaturaConfirmadaEmailProps {
  name: string
  planName: string
  billingPeriod: 'monthly' | 'annual'
  periodEndDate: string // ex: "20/06/2027"
  orderId: string
  appUrl: string
}

const PLAN_FEATURES: Record<string, string[]> = {
  prata: [
    'Acesso a todos os cursos da plataforma',
    'Certificados digitais verificáveis',
    'Suporte via comunidade',
  ],
  ouro: [
    'Tudo do Prata',
    'Sessões mensais em grupo com o mentor',
    'Feedback personalizado em tarefas',
    'Acesso antecipado a novos cursos',
  ],
  diamante: [
    'Tudo do Ouro',
    'Mentoria individual mensal',
    'Canal direto com Fábio Borges',
    'Revisão de plano de negócios',
  ],
  macroempresa: [
    'Plano customizado para equipes',
    'Treinamentos presenciais ou remotos',
    'Suporte dedicado e SLA garantido',
  ],
}

export function AssinaturaConfirmadaEmail({
  name,
  planName,
  billingPeriod,
  periodEndDate,
  orderId,
  appUrl,
}: AssinaturaConfirmadaEmailProps) {
  const dashboardUrl = `${appUrl}/dashboard`
  const features = PLAN_FEATURES[planName.toLowerCase()] ?? ['Acesso completo à plataforma']
  const billingLabel = billingPeriod === 'annual' ? 'Anual (à vista)' : 'Mensal (12x no cartão)'

  return (
    <EmailLayout preview={`Bem-vindo(a) ao Plano ${planName}! Seu acesso está ativo 🚀`}>
      {/* Hero */}
      <Section style={hero}>
        <Text style={emojiStyle}>🚀</Text>
        <Heading style={h1}>Assinatura ativa!</Heading>
        <Text style={heroSub}>
          Bem-vindo(a) ao Plano {planName}, {name}.
        </Text>
      </Section>

      <Text style={text}>
        Sua assinatura foi confirmada com sucesso. A partir de agora você tem acesso completo a
        todos os benefícios do <strong>Plano {planName}</strong>.
      </Text>

      {/* Plan card */}
      <Section style={planCard}>
        <table cellPadding={0} cellSpacing={0} style={{ width: '100%' }}>
          <tbody>
            <tr>
              <td>
                <Text style={planCardLabel}>Plano ativo</Text>
                <Text style={planCardName}>{planName}</Text>
              </td>
              <td style={{ textAlign: 'right' as const, verticalAlign: 'top' }}>
                <Text style={planCardBilling}>{billingLabel}</Text>
                <Text style={planCardExpiry}>Válido até {periodEndDate}</Text>
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      {/* Features */}
      <Text style={featuresTitle}>O que está incluso no seu plano</Text>
      <table cellPadding={0} cellSpacing={0} style={{ width: '100%', marginBottom: '24px' }}>
        <tbody>
          {features.map((feat) => (
            <tr key={feat}>
              <td style={featureIcon}>✅</td>
              <td style={featureText}>{feat}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Section style={{ textAlign: 'center' as const, margin: '8px 0 28px' }}>
        <Button href={dashboardUrl} style={button}>
          Acessar minha área →
        </Button>
      </Section>

      <Hr style={divider} />
      <Text style={receiptText}>
        <strong>Número do pedido:</strong> {orderId}
      </Text>
      <Text style={footer}>Dúvidas sobre o plano? Fale conosco pelo WhatsApp (21) 99702-2329.</Text>
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
  fontSize: '48px',
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
  margin: '0 0 20px',
}

const planCard: React.CSSProperties = {
  backgroundColor: '#1e1b4b',
  borderRadius: '10px',
  padding: '18px 22px',
  marginBottom: '24px',
}

const planCardLabel: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: '700',
  color: '#a5b4fc',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  margin: '0 0 4px',
}

const planCardName: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: '800',
  color: '#ffffff',
  margin: '0',
  letterSpacing: '-0.03em',
}

const planCardBilling: React.CSSProperties = {
  fontSize: '12px',
  color: '#c7d2fe',
  margin: '0 0 2px',
  textAlign: 'right' as const,
}

const planCardExpiry: React.CSSProperties = {
  fontSize: '12px',
  color: '#a5b4fc',
  margin: '0',
  textAlign: 'right' as const,
}

const featuresTitle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: '700',
  color: '#64748b',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  margin: '0 0 12px',
}

const featureIcon: React.CSSProperties = {
  fontSize: '14px',
  paddingRight: '10px',
  paddingBottom: '10px',
  verticalAlign: 'middle',
  width: '24px',
}

const featureText: React.CSSProperties = {
  fontSize: '14px',
  color: '#334155',
  paddingBottom: '10px',
  verticalAlign: 'middle',
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

const receiptText: React.CSSProperties = {
  fontSize: '12px',
  color: '#64748b',
  margin: '0 0 8px',
}

const footer: React.CSSProperties = {
  fontSize: '13px',
  color: '#64748b',
  margin: '0',
}
