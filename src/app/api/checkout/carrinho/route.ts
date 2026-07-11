import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCheckoutProvider } from '@/lib/checkout'
import { createEnrollmentWithAccessWindow } from '@/lib/enrollments/access'

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

  const { items } = parsed.data
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

  if (planItems.length === 1) {
    return checkoutPlan({
      supabase,
      user,
      planId: planItems[0].planId,
      billingPeriod: planItems[0].billingPeriod,
      baseUrl,
      isStub,
    })
  }

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

    return NextResponse.json({ url: `${baseUrl}/checkout/sucesso?cart=1&stub=1` })
  }

  try {
    const { url } = await getCheckoutProvider().createCartCheckout({
      userId: user.id,
      userEmail: user.email!,
      courses: courses.map((course) => ({
        courseId: course.id,
        courseTitle: course.title,
        priceAmountCents: Math.round((course.price ?? 0) * 100),
      })),
      successUrl: `${baseUrl}/checkout/sucesso?cart=1`,
      cancelUrl: `${baseUrl}/checkout/carrinho`,
    })

    return NextResponse.json({ url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao criar checkout'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function checkoutPlan(params: {
  supabase: ReturnType<typeof createClient>
  user: { id: string; email?: string | null }
  planId: 'prata' | 'ouro' | 'diamante' | 'macroempresa'
  billingPeriod: 'monthly' | 'annual'
  baseUrl: string
  isStub: boolean
}) {
  const { supabase, user, planId, billingPeriod, baseUrl, isStub } = params
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
  const priceAmountCents = billingPeriod === 'annual' ? plan.price_annual : plan.price_monthly * 12

  if (isStub) {
    const now = new Date()
    const periodEnd = new Date(now)
    // Todos os planos dão 1 ano de acesso (planosinfos.md), pago 12x ou à vista.
    periodEnd.setDate(periodEnd.getDate() + 365)

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
      cancelUrl: `${baseUrl}/checkout/carrinho`,
    })

    return NextResponse.json({ url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao criar checkout'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
