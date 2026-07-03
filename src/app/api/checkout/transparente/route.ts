import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createEnrollmentWithAccessWindow } from '@/lib/enrollments/access'
import {
  createPagarmeTransparentOrder,
  type TransparentPaymentInput,
} from '@/lib/checkout/providers/pagarme'

/* ─── Zod schemas ─── */

const creditCardPayment = z.object({
  method: z.literal('credit_card'),
  cardNumber: z.string().min(13).max(19),
  cardName: z.string().min(2),
  expMonth: z.string().min(1).max(2),
  expYear: z.string().min(4).max(4),
  cvv: z.string().min(3).max(4),
  installments: z.number().int().min(1).max(12),
  // Gateway exige endereço de cobrança em transações de cartão
  billingAddress: z.object({
    line1: z.string().min(3),
    zipCode: z.string().min(8).max(9),
    city: z.string().min(2),
    state: z.string().length(2),
  }),
})

const pixPayment = z.object({
  method: z.literal('pix'),
})

const boletoPayment = z.object({
  method: z.literal('boleto'),
  customerDocument: z.string().min(11).max(14),
})

const paymentSchema = z.discriminatedUnion('method', [creditCardPayment, pixPayment, boletoPayment])

const courseItemSchema = z.object({
  type: z.literal('course'),
  courseId: z.string().uuid(),
})

const planItemSchema = z.object({
  type: z.literal('plan'),
  planId: z.enum(['prata', 'ouro', 'diamante', 'macroempresa']),
  billingPeriod: z.enum(['monthly', 'annual']).default('monthly'),
})

const bodySchema = z.object({
  source: z.literal('cart'),
  items: z.array(z.discriminatedUnion('type', [courseItemSchema, planItemSchema])).min(1),
  customerName: z.string().min(3),
  // Gateway PagarMe exige CPF e telefone em todos os métodos de pagamento
  customerDocument: z.string().min(11).max(14),
  customerPhone: z.string().min(10).max(15),
  payment: paymentSchema,
})

type CartItem = z.infer<typeof bodySchema>['items'][number]

interface CourseRow {
  id: string
  title: string
  price: number | null
  slug: string
  is_vip: boolean
}

interface PlanRow {
  id: string
  name: string
  price_monthly: number
  price_annual: number
}

function uniqueCourseIds(items: CartItem[]) {
  return Array.from(
    new Set(
      items
        .filter((item): item is Extract<CartItem, { type: 'course' }> => item.type === 'course')
        .map((item) => item.courseId)
    )
  )
}

function boletoExpiresAt(): string {
  const d = new Date()
  d.setDate(d.getDate() + 3)
  return d.toISOString()
}

/* ─── POST handler ─── */

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

  const { items, customerName, customerDocument, customerPhone, payment } = parsed.data

  const planItems = items.filter(
    (item): item is Extract<CartItem, { type: 'plan' }> => item.type === 'plan'
  )
  const courseIds = uniqueCourseIds(items)

  if (planItems.length > 0 && items.length > 1) {
    return NextResponse.json(
      { error: 'Finalize planos separadamente dos cursos avulsos.' },
      { status: 400 }
    )
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const isStub = (process.env.CHECKOUT_PROVIDER ?? 'stub') === 'stub'

  /* ─── Plan checkout ─── */
  if (planItems.length === 1) {
    const planItem = planItems[0]
    const { data: planData } = await supabase
      .from('plans')
      .select('id, name, price_monthly, price_annual')
      .eq('id', planItem.planId)
      .eq('is_active', true)
      .single()

    if (!planData) {
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
    }

    const plan = planData as unknown as PlanRow
    const priceAmountCents =
      planItem.billingPeriod === 'annual' ? plan.price_annual : plan.price_monthly * 12

    if (isStub) {
      return handleStubPayment({
        supabase,
        user,
        payment,
        baseUrl,
        plan: { id: planItem.planId, billingPeriod: planItem.billingPeriod },
        courses: [],
      })
    }

    const pagarmeItems = [
      {
        amount: priceAmountCents,
        description: `Plano ${plan.name}`,
        quantity: 1,
        code: `PLAN-${planItem.planId}`,
      },
    ]

    return callPagarmeAndRespond({
      supabase,
      user,
      customerName,
      customerDocument,
      customerPhone,
      payment,
      items: pagarmeItems,
      code: `PLANO-${planItem.planId}-${Date.now()}`,
      metadata: {
        type: 'plan',
        planId: planItem.planId,
        billingPeriod: planItem.billingPeriod,
        userId: user.id,
        userEmail: user.email ?? '',
      },
      baseUrl,
      courses: [],
      plan: { id: planItem.planId, billingPeriod: planItem.billingPeriod },
    })
  }

  /* ─── Course checkout ─── */
  if (courseIds.length === 0) {
    return NextResponse.json({ error: 'Carrinho vazio' }, { status: 400 })
  }

  const { data: coursesData } = await supabase
    .from('courses')
    .select('id, title, price, slug, is_vip')
    .in('id', courseIds)
    .eq('published', true)

  const courses = (coursesData ?? []) as unknown as CourseRow[]

  if (courses.length !== courseIds.length) {
    return NextResponse.json(
      { error: 'Um ou mais cursos do carrinho não estão disponíveis.' },
      { status: 404 }
    )
  }

  const vipCourse = courses.find((course) => course.is_vip)
  if (vipCourse) {
    return NextResponse.json(
      {
        error:
          'Cursos VIP estão disponíveis apenas nos planos de mentoria e não podem entrar no carrinho avulso.',
      },
      { status: 403 }
    )
  }

  const invalidPrice = courses.find((course) => !course.price || course.price <= 0)
  if (invalidPrice) {
    return NextResponse.json(
      { error: 'Um ou mais cursos do carrinho não possuem preço avulso.' },
      { status: 422 }
    )
  }

  if (isStub) {
    return handleStubPayment({
      supabase,
      user,
      payment,
      baseUrl,
      courses,
      plan: null,
    })
  }

  const pagarmeItems = courses.map((course) => ({
    amount: Math.round((course.price ?? 0) * 100),
    description: course.title,
    quantity: 1,
    code: course.id,
  }))

  return callPagarmeAndRespond({
    supabase,
    user,
    customerName,
    customerDocument,
    customerPhone,
    payment,
    items: pagarmeItems,
    code: `CART-${user.id.substring(0, 8)}-${Date.now()}`,
    metadata: {
      type: 'cart',
      courseIds: JSON.stringify(courses.map((c) => c.id)),
      userId: user.id,
      userEmail: user.email ?? '',
    },
    baseUrl,
    courses,
    plan: null,
  })
}

/* ─── Stub mode ─── */

async function handleStubPayment(params: {
  supabase: ReturnType<typeof createClient>
  user: { id: string; email?: string | null }
  payment: TransparentPaymentInput
  baseUrl: string
  courses: CourseRow[]
  plan: { id: string; billingPeriod: string } | null
}) {
  const { supabase, user, payment, baseUrl, courses, plan } = params

  switch (payment.method) {
    case 'pix':
      return NextResponse.json({
        method: 'pix',
        orderId: 'stub',
        qrCode:
          '00020126580014br.gov.bcb.pix0136a1b2c3d4-e5f6-7890-abcd-ef1234567890520400005303986540510.005802BR5925MENTORIA FABIO BORGES6009SAO PAULO62070503***6304TESTE',
        qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PIX_TESTE',
      })

    case 'boleto':
      return NextResponse.json({
        method: 'boleto',
        orderId: 'stub',
        url: 'https://boleto.pagar.me/stub',
        line: '34191.09008 61207.727227 58028.301249 1 99790000010000',
        dueAt: boletoExpiresAt(),
      })

    case 'credit_card': {
      if (plan) {
        const now = new Date()
        const periodEnd = new Date(now)
        periodEnd.setDate(periodEnd.getDate() + (plan.billingPeriod === 'annual' ? 365 : 30))

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
              plan_tier: plan.id,
              billing_period: plan.billingPeriod,
              period_start: now.toISOString(),
              period_end: periodEnd.toISOString(),
            } as never)
            .eq('id', existing.id)
        } else {
          await supabase.from('subscriptions').insert({
            user_id: user.id,
            plan: 'monthly' as never,
            plan_tier: plan.id,
            billing_period: plan.billingPeriod,
            status: 'active',
            period_start: now.toISOString(),
            period_end: periodEnd.toISOString(),
          } as never)
        }

        await supabase
          .from('users')
          .update({ plan: plan.id } as never)
          .eq('id', user.id)
      } else {
        for (const course of courses) {
          const { data: existing } = await supabase
            .from('enrollments')
            .select('id')
            .eq('user_id', user.id)
            .eq('course_id', course.id)
            .maybeSingle()

          if (!existing) {
            const enrollment = await createEnrollmentWithAccessWindow(supabase, {
              userId: user.id,
              courseId: course.id,
            })
            if (enrollment.error) {
              return NextResponse.json({ error: enrollment.error }, { status: 500 })
            }
          }
        }
      }

      return NextResponse.json({
        method: 'credit_card',
        redirect: `/checkout/sucesso?cart=1&stub=1`,
      })
    }
  }
}

/* ─── Real PagarMe call ─── */

async function callPagarmeAndRespond(params: {
  supabase: ReturnType<typeof createClient>
  user: { id: string; email?: string | null }
  customerName: string
  customerDocument?: string
  customerPhone?: string
  payment: TransparentPaymentInput
  items: Array<{ amount: number; description: string; quantity: number; code?: string }>
  code: string
  metadata: Record<string, string>
  baseUrl: string
  courses: CourseRow[]
  plan: { id: string; billingPeriod: string } | null
}) {
  const {
    supabase,
    user,
    customerName,
    customerDocument,
    customerPhone,
    payment,
    items,
    code,
    metadata,
    courses,
    plan,
  } = params

  try {
    const result = await createPagarmeTransparentOrder({
      code,
      customerName,
      customerEmail: user.email ?? '',
      customerDocument,
      customerPhone,
      items,
      payment,
      metadata,
    })

    switch (result.method) {
      case 'pix':
        return NextResponse.json({
          method: 'pix',
          orderId: result.orderId,
          qrCode: result.qrCode,
          qrCodeUrl: result.qrCodeUrl,
        })

      case 'boleto':
        return NextResponse.json({
          method: 'boleto',
          orderId: result.orderId,
          url: result.url,
          line: result.line,
          dueAt: result.dueAt,
        })

      case 'credit_card': {
        if (!result.paid) {
          return NextResponse.json(
            {
              error: result.failReason ?? 'Pagamento não aprovado',
              method: 'credit_card',
            },
            { status: 422 }
          )
        }

        // Create enrollments / subscriptions on successful card payment
        if (plan) {
          const now = new Date()
          const periodEnd = new Date(now)
          periodEnd.setDate(periodEnd.getDate() + (plan.billingPeriod === 'annual' ? 365 : 30))

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
                plan_tier: plan.id,
                billing_period: plan.billingPeriod,
                period_start: now.toISOString(),
                period_end: periodEnd.toISOString(),
              } as never)
              .eq('id', existing.id)
          } else {
            await supabase.from('subscriptions').insert({
              user_id: user.id,
              plan: 'monthly' as never,
              plan_tier: plan.id,
              billing_period: plan.billingPeriod,
              status: 'active',
              period_start: now.toISOString(),
              period_end: periodEnd.toISOString(),
            } as never)
          }

          await supabase
            .from('users')
            .update({ plan: plan.id } as never)
            .eq('id', user.id)
        } else {
          for (const course of courses) {
            const { data: existing } = await supabase
              .from('enrollments')
              .select('id')
              .eq('user_id', user.id)
              .eq('course_id', course.id)
              .maybeSingle()

            if (!existing) {
              await createEnrollmentWithAccessWindow(supabase, {
                userId: user.id,
                courseId: course.id,
              })
            }
          }
        }

        return NextResponse.json({
          method: 'credit_card',
          redirect: `/checkout/sucesso?cart=1`,
        })
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao processar pagamento'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
