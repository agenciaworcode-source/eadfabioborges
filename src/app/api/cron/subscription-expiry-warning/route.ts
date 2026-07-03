/**
 * Cron: subscription-expiry-warning
 *
 * Dispara e-mail de aviso para assinantes cujo plano vence em ~7 dias.
 *
 * Configuração no vercel.json (crons):
 *   schedule: "0 10 * * *"  → todos os dias às 10h UTC
 *
 * Autenticação via Authorization: Bearer {CRON_SECRET}
 */

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendEmail } from '@/lib/resend'
import { PlanoExpirandoEmail } from '@/emails/PlanoExpirandoEmail'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ead.fabioborgesoficial.com.br'
const DAYS_BEFORE = 7

export async function GET(request: Request) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const now = new Date()

  // Janela: assinaturas que vencem entre 6 e 8 dias a partir de agora
  const from = new Date(now.getTime() + (DAYS_BEFORE - 1) * 86_400_000)
  const to = new Date(now.getTime() + (DAYS_BEFORE + 1) * 86_400_000)

  const { data: subs, error } = await supabase
    .from('subscriptions')
    .select('id, user_id, plan_tier, period_end')
    .eq('status', 'active')
    .gte('period_end', from.toISOString())
    .lte('period_end', to.toISOString())

  if (error) {
    console.error('[cron/subscription-expiry-warning] query error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  type SubRow = { id: string; user_id: string; plan_tier: string; period_end: string }
  const rows = (subs ?? []) as unknown as SubRow[]

  if (rows.length === 0) {
    return NextResponse.json({ sent: 0, message: 'Nenhuma assinatura expirando neste período' })
  }

  const userIds = rows.map((r) => r.user_id)
  const { data: profiles } = await supabase
    .from('users')
    .select('id, name, email')
    .in('id', userIds)

  type ProfileRow = { id: string; name: string; email: string }
  const profileMap = new Map(((profiles ?? []) as unknown as ProfileRow[]).map((p) => [p.id, p]))

  const planNames: Record<string, string> = {
    prata: 'Prata',
    ouro: 'Ouro',
    diamante: 'Diamante',
    macroempresa: 'Macroempresa',
  }

  let sent = 0

  for (const sub of rows) {
    const profile = profileMap.get(sub.user_id)
    if (!profile?.email) continue

    const expiryDate = new Date(sub.period_end)
    const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / 86_400_000)
    const planName = planNames[sub.plan_tier] ?? sub.plan_tier

    void sendEmail(
      profile.email,
      `Seu Plano ${planName} vence em ${daysLeft} dias`,
      PlanoExpirandoEmail({
        name: profile.name ?? profile.email.split('@')[0],
        planName,
        expiryDate: expiryDate.toLocaleDateString('pt-BR'),
        daysLeft,
        appUrl: APP_URL,
      })
    )

    sent++
    console.log(
      `[cron/subscription-expiry-warning] Aviso enviado → ${profile.email} | plano=${planName} | vence=${expiryDate.toISOString()}`
    )
  }

  return NextResponse.json({ sent, total: rows.length })
}
