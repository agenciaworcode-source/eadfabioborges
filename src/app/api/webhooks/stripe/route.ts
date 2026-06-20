import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/service'
import { createEnrollmentWithAccessWindow } from '@/lib/enrollments/access'

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY não configurada')
  return new Stripe(key, { apiVersion: '2026-05-27.dahlia' })
}

export async function POST(request: Request) {
  const body = await request.text() // CRÍTICO: text() antes de qualquer parse
  const sig = request.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceClient()

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const { type, userId, courseId, planId, billingPeriod } = session.metadata ?? {}

      if (type === 'course' && userId && courseId) {
        const { data: existing } = await supabase
          .from('enrollments')
          .select('id')
          .eq('user_id', userId)
          .eq('course_id', courseId)
          .maybeSingle()

        if (!existing) {
          const enrollment = await createEnrollmentWithAccessWindow(supabase, {
            userId,
            courseId,
          })

          if (enrollment.error) {
            throw new Error(enrollment.error)
          }
        }
      }

      if (type === 'plan' && userId && planId) {
        const stripe = getStripe()
        const subscription =
          typeof session.subscription === 'string'
            ? await stripe.subscriptions.retrieve(session.subscription)
            : (session.subscription as Stripe.Subscription)

        if (subscription) {
          const { data: existing } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('user_id', userId)
            .eq('stripe_sub_id', subscription.id)
            .maybeSingle()

          if (!existing) {
            // current_period_start/end estão no item no Stripe API v2026+
            const firstItem = subscription.items?.data?.[0]
            const periodStart = firstItem?.current_period_start
              ? new Date(firstItem.current_period_start * 1000).toISOString()
              : new Date().toISOString()
            const periodEnd = firstItem?.current_period_end
              ? new Date(firstItem.current_period_end * 1000).toISOString()
              : null

            await supabase.from('subscriptions').insert({
              user_id: userId,
              plan: planId,
              billing_period: billingPeriod ?? 'monthly',
              status: 'active',
              stripe_sub_id: subscription.id,
              period_start: periodStart,
              period_end: periodEnd,
            } as never)

            await supabase
              .from('users')
              .update({ plan: planId } as never)
              .eq('id', userId)
          }
        }
      }
    }

    if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object as Stripe.Subscription
      const firstItem = sub.items?.data?.[0]
      const periodEnd = firstItem?.current_period_end
        ? new Date(firstItem.current_period_end * 1000).toISOString()
        : undefined
      await supabase
        .from('subscriptions')
        .update({
          status: sub.status,
          ...(periodEnd ? { period_end: periodEnd } : {}),
        } as never)
        .eq('stripe_sub_id', sub.id)
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription
      await supabase
        .from('subscriptions')
        .update({ status: 'canceled' } as never)
        .eq('stripe_sub_id', sub.id)
    }
  } catch (err) {
    console.error('[webhook/stripe] handler error:', err)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
