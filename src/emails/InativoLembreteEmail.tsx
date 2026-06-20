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

interface InativoLembreteEmailProps {
  name: string
  days: number
  dashboardUrl: string
}

export function InativoLembreteEmail({ name, days, dashboardUrl }: InativoLembreteEmailProps) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>{`Faz ${days} dias que você não acessa a Mentoria — continue de onde parou!`}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>Sentimos sua falta, {name}!</Heading>
          <Text style={text}>
            Faz <strong>{days} dias</strong> que você não acessa a plataforma da
            Mentoria Fábio Borges. Seus cursos estão esperando por você!
          </Text>
          <Text style={text}>
            Continue de onde parou e dê o próximo passo na sua jornada de
            aprendizado em estética avançada.
          </Text>
          <Button href={dashboardUrl} style={button}>
            Retomar meus estudos
          </Button>
          <Hr style={hr} />
          <Text style={footer}>
            Mentoria Fábio Borges · Para não receber mais estes lembretes, acesse
            as configurações da sua conta.
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
