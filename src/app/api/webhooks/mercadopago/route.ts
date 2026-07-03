import { NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { createServiceClient } from '@/lib/supabase/service'
import { createHmac } from 'crypto'
import { createEnrollmentWithAccessWindow } from '@/lib/enrollments/access'

function getMpClient(): MercadoPagoConfig {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!token) throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado')
  return new MercadoPagoConfig({ accessToken: token })
}

/**
 * Valida a assinatura x-signature do MercadoPago.
 * Formato do header: ts=TIMESTAMP,v1=HASH
 * Template de assinatura: id:{paymentId};request-id:{xRequestId};ts:{timestamp};
 */
function validateMpSignature(
  xSignature: string,
  xRequestId: string,
  paymentId: string,
  secret: string
): boolean {
  const parts = Object.fromEntries(
    xSignature.split(',').map((part) => {
      const [k, v] = part.split('=')
      return [k.trim(), v?.trim()]
    })
  )
  const ts = parts['ts']
  const v1 = parts['v1']
  if (!ts || !v1) return false

  const manifest = `id:${paymentId};request-id:${xRequestId};ts:${ts};`
  const hmac = createHmac('sha256', secret).update(manifest).digest('hex')
  return hmac === v1
}

export async function POST(request: Request) {
  const xSignature = request.headers.get('x-signature') ?? ''
  const xRequestId = request.headers.get('x-request-id') ?? ''
  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET

  let payload: { action?: string; data?: { id?: string } }
  try {
    payload = (await request.json()) as typeof payload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const paymentId = payload?.data?.id ?? ''

  // Validar assinatura se secret estiver configurado
  if (webhookSecret) {
    const valid = validateMpSignature(xSignature, xRequestId, paymentId, webhookSecret)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }
  }

  // Só processar eventos de pagamento
  if (payload.action !== 'payment.created' && payload.action !== 'payment.updated') {
    return NextResponse.json({ received: true })
  }

  if (!paymentId) {
    return NextResponse.json({ error: 'Missing payment id' }, { status: 400 })
  }

  try {
    const mp = getMpClient()
    const payment = await new Payment(mp).get({ id: paymentId })

    if (payment.status !== 'approved') {
      return NextResponse.json({ received: true })
    }

    const externalRef = payment.external_reference ?? ''
    const parts = externalRef.split(':')
    const type = parts[0]

    const supabase = createServiceClient()

    if (type === 'course') {
      const [, courseId, userId] = parts
      if (!courseId || !userId) return NextResponse.json({ received: true })

      await activateCourseEnrollment(userId, courseId)
    }

    if (type === 'cart') {
      const [, userId, rawCourseIds] = parts
      if (!userId || !rawCourseIds) return NextResponse.json({ received: true })

      for (const courseId of rawCourseIds.split(',').filter(Boolean)) {
        await activateCourseEnrollment(userId, courseId)
      }
    }

    if (type === 'plan') {
      const [, planId, userId, billingPeriod] = parts
      if (!planId || !userId) return NextResponse.json({ received: true })

      const { data: existing } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', userId)
        .eq('mp_payment_id', String(payment.id))
        .maybeSingle()

      if (!existing) {
        const now = new Date()
        const periodEnd = new Date(now)
        if (billingPeriod === 'annual') {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1)
        } else {
          periodEnd.setMonth(periodEnd.getMonth() + 1)
        }

        await supabase.from('subscriptions').insert({
          user_id: userId,
          plan: planId,
          billing_period: billingPeriod ?? 'monthly',
          status: 'active',
          mp_payment_id: String(payment.id),
          period_start: now.toISOString(),
          period_end: periodEnd.toISOString(),
        } as never)

        await supabase
          .from('users')
          .update({ plan: planId } as never)
          .eq('id', userId)
      }
    }
  } catch (err) {
    console.error('[webhook/mercadopago] handler error:', err)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function activateCourseEnrollment(userId: string, courseId: string) {
  const supabase = createServiceClient()
  const { data: existing } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle()

  if (existing) return

  const enrollment = await createEnrollmentWithAccessWindow(supabase, {
    userId,
    courseId,
  })

  if (enrollment.error) {
    throw new Error(enrollment.error)
  }
}
