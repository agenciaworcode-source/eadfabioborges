/**
 * Webhook PagarMe v5
 *
 * Eventos tratados:
 *   order.paid  → ativa matrícula (type=course) ou assinatura (type=plan)
 *
 * Configuração no dashboard PagarMe:
 *   URL: https://{seu-domínio}/api/webhooks/pagarme
 *   Eventos: order.paid
 *
 * Para testes locais, use ngrok:
 *   npx ngrok http 3000
 *   → copie a URL https gerada e registre no dashboard
 *
 * Autenticação (PagarMe v5 — Basic Auth):
 *   No dashboard, "Habilitar autenticação" define usuário/senha; a PagarMe
 *   envia `Authorization: Basic base64(user:senha)`. Validado contra
 *   PAGARME_WEBHOOK_USER / PAGARME_WEBHOOK_PASSWORD.
 *   Sem credenciais em produção → rejeita (fail-closed). Fora de produção, aceita (dev).
 */

import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'
import { createEnrollmentWithAccessWindow } from '@/lib/enrollments/access'
import { sendEmail } from '@/lib/resend'
import { CompraConfirmadaCursoEmail } from '@/emails/CompraConfirmadaCursoEmail'
import { AssinaturaConfirmadaEmail } from '@/emails/AssinaturaConfirmadaEmail'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ead.fabioborgesoficial.com.br'

// ─── Autenticação (Basic Auth) ───────────────────────────────────────────────
//
// A PagarMe v5 NÃO envia assinatura HMAC. A segurança do webhook é feita via
// HTTP Basic Auth: no dashboard, "Habilitar autenticação" define usuário/senha,
// e a PagarMe passa a enviar `Authorization: Basic base64(user:senha)` em cada
// requisição. Validamos essas credenciais contra as envs
// PAGARME_WEBHOOK_USER / PAGARME_WEBHOOK_PASSWORD.

function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8')
  const bufB = Buffer.from(b, 'utf8')
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

function isAuthorized(request: Request): boolean {
  const user = process.env.PAGARME_WEBHOOK_USER
  const pass = process.env.PAGARME_WEBHOOK_PASSWORD

  if (!user || !pass) {
    // Fail-closed em produção: sem credenciais, NÃO aceitar (evita que um
    // esquecimento de config vire porta aberta para forjar pagamentos).
    // Fora de produção, aceita para facilitar testes locais.
    if (process.env.NODE_ENV === 'production') {
      console.error(
        '[pagarme-webhook] PAGARME_WEBHOOK_USER/PASSWORD ausentes em produção — rejeitando requisição'
      )
      return false
    }
    console.warn(
      '[pagarme-webhook] credenciais de webhook não configuradas — aceitando sem verificação (apenas fora de produção)'
    )
    return true
  }

  const header = request.headers.get('authorization') ?? ''
  const [scheme, encoded] = header.split(' ')
  if (scheme !== 'Basic' || !encoded) {
    console.error(
      `[pagarme-webhook] Authorization ausente/invalido (scheme='${scheme || 'vazio'}')`
    )
    return false
  }

  let decoded = ''
  try {
    decoded = Buffer.from(encoded, 'base64').toString('utf8')
  } catch {
    return false
  }
  const sep = decoded.indexOf(':')
  if (sep < 0) return false
  const gotUser = decoded.slice(0, sep)
  const gotPass = decoded.slice(sep + 1)

  return timingSafeEqualStr(gotUser, user) && timingSafeEqualStr(gotPass, pass)
}

// ─── Tipos do payload ─────────────────────────────────────────────────────────

interface PagarmeOrder {
  id: string
  code: string
  status: string
  metadata: Record<string, string> | null
}

interface PagarmeWebhookEvent {
  id: string
  type: string
  created_at: string
  data: PagarmeOrder
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const rawBody = await request.text()

  let event: PagarmeWebhookEvent
  try {
    event = JSON.parse(rawBody) as PagarmeWebhookEvent
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
  }

  console.log(`[pagarme-webhook] Evento: ${event.type} | id: ${event.id}`)

  if (event.type !== 'order.paid') {
    // Evento não tratado — retorna 200 para evitar reenvio automático
    return NextResponse.json({ received: true, handled: false })
  }

  const order = event.data
  const meta = order.metadata ?? {}
  const type = meta.type

  try {
    if (type === 'course') {
      await activateCourseEnrollment({
        userId: meta.userId,
        courseId: meta.courseId,
        orderId: order.id,
      })
    } else if (type === 'cart') {
      const courseIds = parseCourseIds(meta.courseIds)
      for (const courseId of courseIds) {
        await activateCourseEnrollment({
          userId: meta.userId,
          courseId,
          orderId: order.id,
        })
      }
    } else if (type === 'plan') {
      await activatePlanSubscription({
        userId: meta.userId,
        planId: meta.planId,
        billingPeriod: (meta.billingPeriod ?? 'monthly') as 'monthly' | 'annual',
        orderId: order.id,
      })
    } else {
      console.warn(
        `[pagarme-webhook] order.paid sem type reconhecido: "${type}" | orderId=${order.id}`
      )
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[pagarme-webhook] Erro ao processar order.paid orderId=${order.id}: ${msg}`)
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  return NextResponse.json({ received: true, handled: true })
}

function parseCourseIds(raw: string | undefined): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : []
  } catch {
    return raw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }
}

// ─── Ativar matrícula em curso ────────────────────────────────────────────────

async function activateCourseEnrollment(params: {
  userId: string
  courseId: string
  orderId: string
}): Promise<void> {
  const { userId, courseId, orderId } = params

  if (!userId || !courseId) {
    throw new Error(`[pagarme-webhook] userId ou courseId ausente (orderId=${orderId})`)
  }

  const supabase = createServiceClient()

  // Idempotência — não duplicar se já existir
  const { data: existing } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .in('status', ['active', 'completed'])
    .maybeSingle()

  if (existing) {
    console.log(`[pagarme-webhook] Matrícula já existe — userId=${userId} courseId=${courseId}`)
    return
  }

  const result = await createEnrollmentWithAccessWindow(supabase, { userId, courseId })

  if (result.error) {
    throw new Error(`Falha ao criar matrícula: ${result.error}`)
  }

  // Salvar orderId para rastreabilidade
  await supabase
    .from('enrollments')
    .update({ pagarme_order_id: orderId } as never)
    .eq('id', result.enrollmentId)

  console.log(
    `[pagarme-webhook] ✅ Matrícula ativada: enrollmentId=${result.enrollmentId} userId=${userId} courseId=${courseId}`
  )

  // Disparar e-mail de confirmação de compra
  const { data: userData } = await supabase
    .from('users')
    .select('name, email')
    .eq('id', userId)
    .maybeSingle()
  const { data: courseData } = await supabase
    .from('courses')
    .select('title, slug')
    .eq('id', courseId)
    .maybeSingle()
  type UserRow = { name: string; email: string }
  type CourseRow = { title: string; slug: string }
  const u = userData as unknown as UserRow | null
  const c = courseData as unknown as CourseRow | null
  if (u?.email && c) {
    void sendEmail(
      u.email,
      `Acesso liberado: ${c.title}`,
      CompraConfirmadaCursoEmail({
        name: u.name ?? u.email.split('@')[0],
        courseName: c.title,
        courseSlug: c.slug,
        orderId,
        appUrl: APP_URL,
      })
    )
  }
}

// ─── Ativar assinatura de plano ───────────────────────────────────────────────

async function activatePlanSubscription(params: {
  userId: string
  planId: string
  billingPeriod: 'monthly' | 'annual'
  orderId: string
}): Promise<void> {
  const { userId, planId, billingPeriod, orderId } = params

  if (!userId || !planId) {
    throw new Error(`[pagarme-webhook] userId ou planId ausente (orderId=${orderId})`)
  }

  const supabase = createServiceClient()

  const now = new Date()
  const periodEnd = new Date(now)
  // Todos os planos dão 1 ano de acesso (planosinfos.md), pago 12x ou à vista.
  periodEnd.setDate(periodEnd.getDate() + 365)

  const { data: existing } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (existing) {
    // Renovação ou upgrade
    await supabase
      .from('subscriptions')
      .update({
        plan_tier: planId,
        billing_period: billingPeriod,
        period_start: now.toISOString(),
        period_end: periodEnd.toISOString(),
        pagarme_order_id: orderId,
      } as never)
      .eq('id', existing.id)

    console.log(
      `[pagarme-webhook] ✅ Assinatura renovada/atualizada: userId=${userId} plan=${planId}`
    )
  } else {
    // Nova assinatura
    const { error } = await supabase.from('subscriptions').insert({
      user_id: userId,
      plan: 'monthly' as never, // campo legado
      plan_tier: planId,
      billing_period: billingPeriod,
      status: 'active',
      period_start: now.toISOString(),
      period_end: periodEnd.toISOString(),
      pagarme_order_id: orderId,
    } as never)

    if (error) throw new Error(`Falha ao criar assinatura: ${error.message}`)
  }

  // Atualizar plano no perfil do usuário
  await supabase
    .from('users')
    .update({ plan: planId } as never)
    .eq('id', userId)

  console.log(
    `[pagarme-webhook] ✅ Plano ativado: userId=${userId} plan=${planId} até ${periodEnd.toISOString()}`
  )

  // Disparar e-mail de confirmação de assinatura
  const { data: userDataPlan } = await supabase
    .from('users')
    .select('name, email')
    .eq('id', userId)
    .maybeSingle()
  type UserRowPlan = { name: string; email: string }
  const up = userDataPlan as unknown as UserRowPlan | null
  if (up?.email) {
    const planNames: Record<string, string> = {
      prata: 'Prata',
      ouro: 'Ouro',
      diamante: 'Diamante',
      macroempresa: 'Macroempresa',
    }
    void sendEmail(
      up.email,
      `Assinatura confirmada — Plano ${planNames[planId] ?? planId}`,
      AssinaturaConfirmadaEmail({
        name: up.name ?? up.email.split('@')[0],
        planName: planNames[planId] ?? planId,
        billingPeriod,
        periodEndDate: periodEnd.toLocaleDateString('pt-BR'),
        orderId,
        appUrl: APP_URL,
      })
    )
  }
}
