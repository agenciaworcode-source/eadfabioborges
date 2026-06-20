import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendEmail } from '@/lib/resend'
import { InativoLembreteEmail } from '@/emails/InativoLembreteEmail'

// Thresholds de inatividade em dias
const THRESHOLDS = [7, 14, 30]

export async function GET(request: Request) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const now = new Date()
  let sent = 0

  for (const days of THRESHOLDS) {
    const from = new Date(now.getTime() - (days + 1) * 86_400_000)
    const to = new Date(now.getTime() - days * 86_400_000)

    // Paginar auth.users para buscar last_sign_in_at no range correto
    const { data: usersPage, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })

    if (error) {
      console.error('[cron/inactivity-reminder] listUsers error:', error)
      continue
    }

    const inactiveUsers = (usersPage?.users ?? []).filter((u) => {
      if (!u.last_sign_in_at) return false
      const last = new Date(u.last_sign_in_at).getTime()
      return last >= from.getTime() && last < to.getTime()
    })

    // Buscar nomes na tabela public.users
    const ids = inactiveUsers.map((u) => u.id)
    const { data: profiles } = ids.length
      ? await supabase.from('users').select('id, name, email').in('id', ids)
      : { data: [] }

    const profileMap = new Map(
      (profiles ?? []).map((p) => [p.id as string, p as { id: string; name: string; email: string }]),
    )

    for (const u of inactiveUsers) {
      const profile = profileMap.get(u.id)
      const email = profile?.email ?? u.email
      const name = profile?.name ?? u.email?.split('@')[0] ?? 'Aluno'
      if (!email) continue

      void sendEmail(
        email,
        `Faz ${days} dias que você não acessa a Mentoria`,
        InativoLembreteEmail({
          name,
          days,
          dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        }),
      )
      sent++
    }
  }

  return NextResponse.json({ sent })
}
