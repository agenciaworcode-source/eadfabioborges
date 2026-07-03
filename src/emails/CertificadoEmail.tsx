import { Button, Heading, Text, Hr, Section, Link } from '@react-email/components'
import { EmailLayout } from './EmailLayout'

interface CertificadoEmailProps {
  name: string
  courseName: string
  certificadosUrl: string
  certificateUrl: string
}

export function CertificadoEmail({
  name,
  courseName,
  certificadosUrl,
  certificateUrl,
}: CertificadoEmailProps) {
  return (
    <EmailLayout preview={`Parabéns! Seu certificado de ${courseName} está pronto 🏆`}>
      {/* Hero */}
      <Section style={hero}>
        <Text style={emoji}>🏆</Text>
        <Heading style={h1}>Parabéns, {name}!</Heading>
        <Text style={heroSub}>Você concluiu o curso com sucesso.</Text>
      </Section>

      {/* Course Badge */}
      <Section style={courseBadge}>
        <Text style={courseBadgeLabel}>Curso concluído</Text>
        <Text style={courseBadgeName}>{courseName}</Text>
      </Section>

      <Text style={text}>
        Seu <strong>certificado digital</strong> já foi emitido e está disponível na sua área do
        aluno. O certificado possui QR Code de verificação e pode ser compartilhado com empregadores
        e redes profissionais.
      </Text>

      <Section style={{ textAlign: 'center' as const, margin: '28px 0' }}>
        <Button href={certificateUrl} style={button}>
          Ver meu certificado →
        </Button>
      </Section>

      <Hr style={divider} />

      {/* Features */}
      <table cellPadding={0} cellSpacing={0} style={{ width: '100%' }}>
        <tbody>
          {[
            { icon: '✅', text: 'QR Code de verificação incluso' },
            { icon: '📤', text: 'Compartilhe no LinkedIn e redes sociais' },
            { icon: '🔒', text: 'Validação digital segura' },
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
        Acesse todos os seus certificados em{' '}
        <Link href={certificadosUrl} style={link}>
          Meus Certificados
        </Link>
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

const emoji: React.CSSProperties = {
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

const courseBadge: React.CSSProperties = {
  backgroundColor: '#fefce8',
  border: '1px solid #fde047',
  borderRadius: '10px',
  padding: '16px 20px',
  marginBottom: '20px',
  textAlign: 'center' as const,
}

const courseBadgeLabel: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: '700',
  color: '#854d0e',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  margin: '0 0 4px',
}

const courseBadgeName: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: '700',
  color: '#713f12',
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

const link: React.CSSProperties = {
  color: '#4f46e5',
  textDecoration: 'underline',
}

const footer: React.CSSProperties = {
  fontSize: '13px',
  color: '#64748b',
  margin: '0',
}
