import { Button, Heading, Text, Hr, Section } from '@react-email/components'
import { EmailLayout } from './EmailLayout'

interface CompraConfirmadaCursoEmailProps {
  name: string
  courseName: string
  courseSlug: string
  orderId: string
  appUrl: string
}

export function CompraConfirmadaCursoEmail({
  name,
  courseName,
  courseSlug,
  orderId,
  appUrl,
}: CompraConfirmadaCursoEmailProps) {
  const courseUrl = `${appUrl}/dashboard/curso/${courseSlug}`
  const dashboardUrl = `${appUrl}/dashboard`

  return (
    <EmailLayout preview={`Compra confirmada! Seu acesso a "${courseName}" está liberado 🎓`}>
      {/* Hero */}
      <Section style={hero}>
        <Text style={emojiStyle}>🎓</Text>
        <Heading style={h1}>Acesso liberado!</Heading>
        <Text style={heroSub}>Sua compra foi confirmada com sucesso.</Text>
      </Section>

      <Text style={text}>
        Olá, <strong>{name}</strong>! Sua compra foi processada e o acesso ao curso já está
        disponível na sua área do aluno.
      </Text>

      {/* Course card */}
      <Section style={courseCard}>
        <Text style={courseCardLabel}>Curso adquirido</Text>
        <Text style={courseCardName}>{courseName}</Text>
        <Text style={courseCardMeta}>Acesso imediato · Certificado incluso</Text>
      </Section>

      <Section style={{ textAlign: 'center' as const, margin: '28px 0' }}>
        <Button href={courseUrl} style={buttonPrimary}>
          Começar agora →
        </Button>
      </Section>

      <Hr style={divider} />

      {/* Perks */}
      <table cellPadding={0} cellSpacing={0} style={{ width: '100%' }}>
        <tbody>
          {[
            { icon: '✅', text: 'Acesso vitalício ao conteúdo' },
            { icon: '📜', text: 'Certificado digital ao concluir' },
            { icon: '💬', text: 'Suporte da comunidade Mentoria' },
          ].map((item) => (
            <tr key={item.text}>
              <td style={featureIcon}>{item.icon}</td>
              <td style={featureText}>{item.text}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Hr style={divider} />

      <Text style={receiptText}>
        <strong>Número do pedido:</strong> {orderId}
      </Text>
      <Text style={footer}>
        Dúvidas? Entre em contato pelo WhatsApp (21) 99702-2329 ou acesse{' '}
        <a href={dashboardUrl} style={link}>
          sua área do aluno
        </a>
        .
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

const text: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '1.65',
  color: '#334155',
  margin: '0 0 20px',
}

const courseCard: React.CSSProperties = {
  backgroundColor: '#eef2ff',
  border: '1px solid #c7d2fe',
  borderRadius: '10px',
  padding: '18px 22px',
  marginBottom: '20px',
}

const courseCardLabel: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: '700',
  color: '#4338ca',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  margin: '0 0 6px',
}

const courseCardName: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: '700',
  color: '#1e1b4b',
  margin: '0 0 4px',
}

const courseCardMeta: React.CSSProperties = {
  fontSize: '13px',
  color: '#6366f1',
  margin: '0',
}

const buttonPrimary: React.CSSProperties = {
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

const receiptText: React.CSSProperties = {
  fontSize: '12px',
  color: '#64748b',
  margin: '0 0 8px',
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
