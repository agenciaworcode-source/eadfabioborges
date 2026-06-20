import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { sendEmail } from '@/lib/resend'
import { BoasVindasEmail } from '@/emails/BoasVindasEmail'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=oauth_failed`)
  }

  const supabase = createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/auth/login?error=oauth_failed`)
  }

  // Disparo de boas-vindas apenas no primeiro login
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user?.email) {
    const created = new Date(user.created_at).getTime()
    const lastSignIn = new Date(user.last_sign_in_at ?? user.created_at).getTime()
    const isFirstLogin = Math.abs(lastSignIn - created) < 60_000

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
