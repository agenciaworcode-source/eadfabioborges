import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Hr,
} from '@react-email/components'

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
    <Html lang="pt-BR">
      <Head />
      <Preview>Seu certificado de {courseName} está pronto!</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>Parabéns, {name}!</Heading>
          <Text style={text}>
            Você concluiu o curso <strong>{courseName}</strong> com sucesso. Seu
            certificado digital já foi emitido e está disponível na sua área do
            aluno.
          </Text>
          <Text style={text}>
            O certificado possui QR Code de verificação e pode ser compartilhado
            com employadores e redes profissionais.
          </Text>
          <Button href={certificateUrl} style={button}>
            Ver meu certificado
          </Button>
          <Text style={textSmall}>
            Ou acesse todos os seus certificados em{' '}
            <a href={certificadosUrl} style={link}>
              Meus Certificados
            </a>
            .
          </Text>
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

const textSmall = { fontSize: '13px', lineHeight: '1.5', color: '#6b7280', margin: '16px 0 0' }

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

const link = { color: '#4f46e5', textDecoration: 'underline' }

const hr = { borderColor: '#e5e7eb', margin: '24px 0' }

const footer = { fontSize: '12px', color: '#9ca3af', margin: '0' }
