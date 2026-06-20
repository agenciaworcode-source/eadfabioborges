import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { sendEmail } from '@/lib/resend'
import { BoasVindasEmail } from '@/emails/BoasVindasEmail'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  if (!token_hash || !type) {
    return NextResponse.redirect(`${origin}/auth/login?error=invalid_link`)
  }

  const supabase = createClient()
  const { error } = await supabase.auth.verifyOtp({ token_hash, type })

  if (error) {
    return NextResponse.redirect(`${origin}/auth/login?error=link_expired`)
  }

  // Enviar boas-vindas apenas no primeiro login (cadastro por email)
  const { data: { user } } = await supabase.auth.getUser()

  if (user?.email) {
    const created = new Date(user.created_at).getTime()
    const lastSignIn = new Date(user.last_sign_in_at ?? user.created_at).getTime()
    const isFirstLogin = Math.abs(lastSignIn - created) < 120_000 // 2 min margin

    if (isFirstLogin) {
      const name =
        (user.user_metadata?.full_name as string | undefined) ??
        user.email.split('@')[0] ??
        'Aluno'
      void sendEmail(
        user.email,
        'Bem-vindo(a) à Mentoria Fábio Borges!',
        BoasVindasEmail({
          name,
          dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        }),
      )
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
