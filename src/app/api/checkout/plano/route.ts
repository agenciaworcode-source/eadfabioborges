import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCheckoutProvider } from '@/lib/checkout'

const bodySchema = z.object({
  planId: z.string().min(1),
  billingPeriod: z.enum(['monthly', 'annual']).default('monthly'),
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
      { status: 400 },
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
  const priceAmountCents =
    billingPeriod === 'annual' ? plan.price_annual : plan.price_monthly

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  try {
    const { url } = await getCheckoutProvider().createPlanCheckout({
      planId: plan.id,
      planName: plan.name,
      userId: user.id,
      userEmail: user.email!,
      priceAmountCents,
      billingPeriod,
      successUrl: `${baseUrl}/checkout/sucesso?plan=${plan.id}`,
      cancelUrl: `${baseUrl}/planos`,
    })

    return NextResponse.json({ url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao criar sessão de checkout'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
