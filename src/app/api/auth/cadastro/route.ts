import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import { sendEmail } from '@/lib/resend'
import { BoasVindasEmail } from '@/emails/BoasVindasEmail'

const bodySchema = z.object({
  name: z.string().min(2, 'Nome inválido').max(120),
  email: z.string().email('E-mail inválido').max(254),
  password: z.string().min(8, 'Senha muito curta').max(128),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    const firstError = parsed.error.flatten().fieldErrors
    const first = Object.values(firstError).flat()[0] ?? 'Dados inválidos'
    return NextResponse.json({ error: first }, { status: 400 })
  }

  const { name, email, password } = parsed.data
  const supabase = createServiceClient()

  // Cria o usuário via Admin API com email já confirmado
  // Isso bypassa completamente o SMTP interno do Supabase (sem rate limit)
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  })

  if (error) {
    // Usuário já cadastrado
    if (
      error.message.toLowerCase().includes('already registered') ||
      error.message.toLowerCase().includes('already exists') ||
      error.message.toLowerCase().includes('duplicate')
    ) {
      return NextResponse.json(
        { error: 'Este e-mail já está cadastrado. Tente fazer login.' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Envia boas-vindas via Resend (sem rate limit do Supabase)
  if (data.user?.email) {
    void sendEmail(
      data.user.email,
      'Bem-vindo(a) à Mentoria Fábio Borges!',
      BoasVindasEmail({
        name,
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://ead.fabioborgesoficial.com.br'}/dashboard`,
      })
    )
  }

  return NextResponse.json({ success: true })
}
