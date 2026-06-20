# 11. Arquitetura Backend

## 11.1 Padrão de API Route (Next.js)

```typescript
// app/api/checkout/curso/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { stripe } from '@/lib/stripe'
import { checkoutCursoSchema } from '@/lib/validations/checkout'

export async function POST(request: NextRequest) {
  try {
    // 1. Parse e validação com Zod (SEMPRE primeiro)
    const body = await request.json()
    const { courseId } = checkoutCursoSchema.parse(body)

    // 2. Verificar autenticação via Supabase
    const supabase = createServerClient(/* cookies */)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 3. Buscar dados necessários
    const { data: course } = await supabase.from('courses').select('*').eq('id', courseId).single()
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // 4. Criar Stripe session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: course.stripe_price_id, quantity: 1 }],
      customer_email: user.email,
      metadata: { courseId, userId: user.id },
      success_url: `${process.env.NEXT_PUBLIC_URL}/checkout/sucesso`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/cursos/${course.slug}`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    // Zod parse error
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 })
    }
    console.error('[checkout/curso]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
```

## 11.2 Padrão de Webhook (Stripe)

```typescript
// app/api/webhooks/stripe/route.ts
import Stripe from 'stripe'
import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js' // service_role — bypass RLS

export async function POST(request: NextRequest) {
  const body = await request.text() // RAW body — obrigatório para HMAC
  const signature = headers().get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Idempotência: evitar processamento duplo
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: existing } = await supabaseAdmin
    .from('processed_stripe_events')
    .select('id')
    .eq('event_id', event.id)
    .single()
  if (existing) return NextResponse.json({ received: true }) // já processado

  // Processar evento
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, supabaseAdmin)
      break
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, supabaseAdmin)
      break
    // ...outros eventos
  }

  // Marcar como processado
  await supabaseAdmin.from('processed_stripe_events').insert({ event_id: event.id })

  return NextResponse.json({ received: true })
}
```

---
