import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Hr,
  Link,
  Img,
} from '@react-email/components'
import type { ReactNode } from 'react'

interface EmailLayoutProps {
  preview: string
  children: ReactNode
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ead.fabioborgesoficial.com.br'

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        {/* Header */}
        <Section style={header}>
          <Container style={headerInner}>
            <table cellPadding={0} cellSpacing={0} style={{ width: '100%' }}>
              <tbody>
                <tr>
                  <td>
                    <Text style={brandName}>Fábio Borges</Text>
                    <Text style={brandSub}>Mentoria</Text>
                  </td>
                  <td style={{ textAlign: 'right' as const }}>
                    <Text style={badgeText}>Plataforma EAD</Text>
                  </td>
                </tr>
              </tbody>
            </table>
          </Container>
        </Section>

        {/* Body */}
        <Container style={container}>{children}</Container>

        {/* Footer */}
        <Container style={footer}>
          <Hr style={footerDivider} />
          <table cellPadding={0} cellSpacing={0} style={{ width: '100%', marginBottom: '16px' }}>
            <tbody>
              <tr>
                <td style={{ verticalAlign: 'top', paddingRight: '20px' }}>
                  <Text style={footerLabel}>Contato</Text>
                  <Link href="https://wa.me/5521997022329" style={footerLink}>
                    WhatsApp: (21) 99702-2329
                  </Link>
                  <Text style={{ ...footerMuted, margin: '2px 0 0' }}>
                    <Link href="mailto:mentoriafabioborges@gmail.com" style={footerLink}>
                      mentoriafabioborges@gmail.com
                    </Link>
                  </Text>
                </td>
                <td style={{ verticalAlign: 'top' }}>
                  <Text style={footerLabel}>Atendimento</Text>
                  <Text style={footerMuted}>Seg. a Sex.: 09h às 18h</Text>
                  <Text style={{ ...footerMuted, margin: '2px 0 0' }}>Sábado: 09h às 12h</Text>
                </td>
              </tr>
            </tbody>
          </table>
          <Hr style={footerDivider} />
          <Text style={footerCopy}>
            © 2026 Fábio Borges Mentoria. Todos os direitos reservados.
            {' · '}
            <Link href={`${APP_URL}/dashboard`} style={footerLinkMuted}>
              Área do aluno
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const body: React.CSSProperties = {
  backgroundColor: '#f1f5f9',
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  margin: 0,
  padding: '32px 0',
}

const header: React.CSSProperties = {
  backgroundColor: '#1e1b4b',
  padding: '0',
  marginBottom: '0',
}

const headerInner: React.CSSProperties = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '20px 28px',
}

const brandName: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: '700',
  color: '#ffffff',
  margin: '0',
  letterSpacing: '-0.02em',
  lineHeight: '1.2',
}

const brandSub: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: '500',
  color: '#a5b4fc',
  margin: '2px 0 0',
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
}

const badgeText: React.CSSProperties = {
  fontSize: '11px',
  color: '#c7d2fe',
  margin: '0',
  paddingTop: '4px',
}

const container: React.CSSProperties = {
  maxWidth: '560px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
  borderRadius: '0 0 12px 12px',
  padding: '36px 32px 32px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
}

const footer: React.CSSProperties = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '0 8px',
}

const footerDivider: React.CSSProperties = {
  borderColor: '#e2e8f0',
  margin: '20px 0',
}

const footerLabel: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: '700',
  color: '#64748b',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  margin: '0 0 6px',
}

const footerLink: React.CSSProperties = {
  fontSize: '13px',
  color: '#4f46e5',
  textDecoration: 'none',
}

const footerLinkMuted: React.CSSProperties = {
  fontSize: '12px',
  color: '#94a3b8',
  textDecoration: 'none',
}

const footerMuted: React.CSSProperties = {
  fontSize: '13px',
  color: '#64748b',
  margin: '4px 0 0',
}

const footerCopy: React.CSSProperties = {
  fontSize: '11px',
  color: '#94a3b8',
  textAlign: 'center' as const,
  margin: '0 0 8px',
}
