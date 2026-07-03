import { Button, Heading, Text, Hr, Section, Link } from '@react-email/components'
import { EmailLayout } from './EmailLayout'

interface PlanoExpirandoEmailProps {
  name: string
  planName: string
  expiryDate: string // ex: "27/06/2026"
  daysLeft: number
  appUrl: string
}

export function PlanoExpirandoEmail({
  name,
  planName,
  expiryDate,
  daysLeft,
  appUrl,
}: PlanoExpirandoEmailProps) {
  const planosUrl = `${appUrl}/planos`

  return (
    <EmailLayout
      preview={`Seu Plano ${planName} vence em ${daysLeft} dias — renove e continue evoluindo`}
    >
      {/* Hero */}
      <Section style={hero}>
        <Text style={emojiStyle}>⏳</Text>
        <Heading style={h1}>Seu plano está expirando</Heading>
        <Text style={heroSub}>{name}, renove para não perder o acesso.</Text>
      </Section>

      {/* Urgency badge */}
      <Section style={urgencyBox}>
        <table cellPadding={0} cellSpacing={0} style={{ width: '100%' }}>
          <tbody>
            <tr>
              <td>
                <Text style={urgencyLabel}>Plano atual</Text>
                <Text style={urgencyPlan}>{planName}</Text>
              </td>
              <td style={{ textAlign: 'right' as const }}>
                <Text style={urgencyLabel}>Vence em</Text>
                <Text style={urgencyDays}>{daysLeft} dias</Text>
                <Text style={urgencyDate}>{expiryDate}</Text>
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Text style={text}>
        Seu acesso aos cursos, materiais e benefícios do <strong>Plano {planName}</strong> será
        encerrado no dia <strong>{expiryDate}</strong>. Renove agora para continuar sua jornada de
        aprendizado sem interrupções.
      </Text>

      <Section style={{ textAlign: 'center' as const, margin: '28px 0' }}>
        <Button href={planosUrl} style={button}>
          Renovar meu plano →
        </Button>
      </Section>

      <Hr style={divider} />

      <Text style={warningText}>
        ⚠️ Após o vencimento, seu acesso aos cursos e materiais exclusivos será suspenso
        automaticamente.
      </Text>

      <Hr style={divider} />
      <Text style={footer}>
        Prefere falar com a equipe antes de renovar?{' '}
        <Link href="https://wa.me/5521997022329" style={link}>
          WhatsApp: (21) 99702-2329
        </Link>
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

const urgencyBox: React.CSSProperties = {
  backgroundColor: '#fff7ed',
  border: '1px solid #fed7aa',
  borderRadius: '10px',
  padding: '16px 20px',
  marginBottom: '20px',
}

const urgencyLabel: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: '700',
  color: '#9a3412',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  margin: '0 0 4px',
}

const urgencyPlan: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: '700',
  color: '#7c2d12',
  margin: '0',
}

const urgencyDays: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: '800',
  color: '#ea580c',
  margin: '0',
  lineHeight: '1',
  textAlign: 'right' as const,
  letterSpacing: '-0.04em',
}

const urgencyDate: React.CSSProperties = {
  fontSize: '12px',
  color: '#9a3412',
  margin: '2px 0 0',
  textAlign: 'right' as const,
}

const text: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '1.65',
  color: '#334155',
  margin: '0 0 16px',
}

const button: React.CSSProperties = {
  backgroundColor: '#ea580c',
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

const warningText: React.CSSProperties = {
  fontSize: '13px',
  color: '#b45309',
  backgroundColor: '#fffbeb',
  border: '1px solid #fde68a',
  borderRadius: '6px',
  padding: '12px 16px',
  margin: '0',
}

const link: React.CSSProperties = {
  color: '#4f46e5',
  textDecoration: 'underline',
}

const footer: React.CSSProperties = {
  fontSize: '13px',
  color: '#64748b',
  margin: '0',
}
