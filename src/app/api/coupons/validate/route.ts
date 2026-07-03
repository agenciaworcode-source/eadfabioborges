import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

interface CouponRow {
  id: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  max_uses: number | null
  uses_count: number
  valid_from: string | null
  valid_until: string | null
  applies_to: 'all' | 'plans' | 'courses'
  plan_ids: string[]
  course_ids: string[]
  is_active: boolean
}

export async function POST(request: Request) {
  const body = await request.json()
  const { code, totalCents, orderType, planIds, courseIds } = body as {
    code: string
    totalCents: number
    orderType: 'plan' | 'course' | 'cart'
    planIds?: string[]
    courseIds?: string[]
  }

  if (!code) {
    return NextResponse.json({ valid: false, error: 'Informe o código do cupom.' })
  }

  const sb = createServiceClient()

  const { data, error } = await (
    sb as unknown as {
      from: (t: string) => {
        select: (cols: string) => {
          eq: (
            col: string,
            val: string
          ) => {
            single: () => Promise<{
              data: CouponRow | null
              error: { message: string; code?: string } | null
            }>
          }
        }
      }
    }
  )
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase().trim())
    .single()

  if (error || !data) {
    return NextResponse.json({ valid: false, error: 'Cupom não encontrado.' })
  }

  const coupon = data

  // Verificar se ativo
  if (!coupon.is_active) {
    return NextResponse.json({ valid: false, error: 'Este cupom está inativo.' })
  }

  // Verificar validade de datas
  const now = new Date()
  if (coupon.valid_from && new Date(coupon.valid_from) > now) {
    return NextResponse.json({ valid: false, error: 'Este cupom ainda não é válido.' })
  }
  if (coupon.valid_until && new Date(coupon.valid_until) < now) {
    return NextResponse.json({ valid: false, error: 'Este cupom expirou.' })
  }

  // Verificar usos
  if (coupon.max_uses !== null && coupon.uses_count >= coupon.max_uses) {
    return NextResponse.json({ valid: false, error: 'Este cupom atingiu o limite de usos.' })
  }

  // Verificar escopo
  if (coupon.applies_to === 'plans') {
    const userPlanIds = planIds ?? []
    const couponPlanIds = coupon.plan_ids ?? []
    const hasMatch = userPlanIds.some((id) => couponPlanIds.includes(id))
    if (!hasMatch) {
      return NextResponse.json({
        valid: false,
        error: 'Este cupom não se aplica aos itens selecionados.',
      })
    }
  } else if (coupon.applies_to === 'courses') {
    const userCourseIds = courseIds ?? []
    const couponCourseIds = coupon.course_ids ?? []
    const hasMatch = userCourseIds.some((id) => couponCourseIds.includes(id))
    if (!hasMatch) {
      return NextResponse.json({
        valid: false,
        error: 'Este cupom não se aplica aos cursos selecionados.',
      })
    }
  }

  // Calcular desconto
  let discountCents: number
  if (coupon.type === 'percentage') {
    discountCents = Math.round((totalCents * coupon.value) / 100)
  } else {
    // fixed: value já está em centavos
    discountCents = Math.round(Number(coupon.value))
  }
  discountCents = Math.min(discountCents, totalCents)
  const finalCents = totalCents - discountCents

  // Label amigável
  const label =
    coupon.type === 'percentage'
      ? `${coupon.value}% de desconto`
      : `R$ ${(Number(coupon.value) / 100).toFixed(2).replace('.', ',')} de desconto`

  return NextResponse.json({
    valid: true,
    discountCents,
    finalCents,
    label,
    couponId: coupon.id,
  })
}
