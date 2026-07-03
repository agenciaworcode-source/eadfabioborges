import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCheckoutProvider } from '@/lib/checkout'

const bodySchema = z.object({
  planId: z.enum(['prata', 'ouro', 'diamante', 'macroempresa']),
  billingPeriod: z.enum(['monthly', 'annual']).default('monthly'),
  source: z.literal('cart'),
})

interface PlanRow {
  id: string
  name: string
  price_monthly: number
  price_annual: number
}

export async function POST(request: Request) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { planId, billingPeriod } = parsed.data

  const { data: planData } = await supabase
    .from('plans')
    .select('id, name, price_monthly, price_annual')
    .eq('id', planId)
    .eq('is_active', true)
    .single()

  if (!planData) {
    return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
  }

  const plan = planData as unknown as PlanRow
  // Monthly = cobra o total anual (12 × parcela) — PagarMe fracionará em 12x no cartão
  // Annual  = valor à vista com 17% de desconto
  const priceAmountCents = billingPeriod === 'annual' ? plan.price_annual : plan.price_monthly * 12

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const isStub = (process.env.CHECKOUT_PROVIDER ?? 'stub') === 'stub'

  // Stub: ativa assinatura imediatamente sem pagamento (apenas dev/testes)
  if (isStub) {
    const now = new Date()
    const periodEnd = new Date(now)
    periodEnd.setDate(periodEnd.getDate() + (billingPeriod === 'annual' ? 365 : 30))

    const { data: existing } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (existing) {
      await supabase
        .from('subscriptions')
        .update({
          plan_tier: planId,
          billing_period: billingPeriod,
          period_start: now.toISOString(),
          period_end: periodEnd.toISOString(),
        } as never)
        .eq('id', existing.id)
    } else {
      await supabase.from('subscriptions').insert({
        user_id: user.id,
        plan: 'monthly' as never,
        plan_tier: planId,
        billing_period: billingPeriod,
        status: 'active',
        period_start: now.toISOString(),
        period_end: periodEnd.toISOString(),
      } as never)
    }

    await supabase
      .from('users')
      .update({ plan: planId } as never)
      .eq('id', user.id)

    return NextResponse.json({
      url: `${baseUrl}/dashboard?plano=ativado&tier=${planId}`,
    })
  }

  try {
    const { url } = await getCheckoutProvider().createPlanCheckout({
      planId: plan.id,
      planName: plan.name,
      userId: user.id,
      userEmail: user.email!,
      priceAmountCents,
      billingPeriod,
      successUrl: `${baseUrl}/checkout/sucesso?plano=${plan.id}`,
      cancelUrl: `${baseUrl}/planos`,
    })

    return NextResponse.json({ url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao criar checkout'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
