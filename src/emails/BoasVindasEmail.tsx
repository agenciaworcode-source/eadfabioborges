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

interface BoasVindasEmailProps {
  name: string
  dashboardUrl: string
}

export function BoasVindasEmail({ name, dashboardUrl }: BoasVindasEmailProps) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>Bem-vindo(a) à Mentoria Fábio Borges!</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>Olá, {name}!</Heading>
          <Text style={text}>
            Seja bem-vindo(a) à plataforma de Mentoria Fábio Borges. Seu cadastro
            está ativo e você já pode acessar todos os cursos disponíveis para o
            seu plano.
          </Text>
          <Text style={text}>
            Clique no botão abaixo para acessar sua área do aluno e começar sua
            jornada de aprendizado.
          </Text>
          <Button href={dashboardUrl} style={button}>
            Acessar minha área
          </Button>
          <Hr style={hr} />
          <Text style={footer}>
            Mentoria Fábio Borges · Se você não criou uma conta, ignore este email.
          </Text>
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
