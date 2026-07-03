import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const bodySchema = z.object({
  courseIds: z.array(z.string().uuid()).default([]),
})

interface CourseRow {
  id: string
  title: string
  price: number | null
  slug: string
  is_vip: boolean
}

export async function POST(request: Request) {
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

  const courseIds = Array.from(new Set(parsed.data.courseIds))
  if (courseIds.length === 0) {
    return NextResponse.json({ courses: [], totalCents: 0 })
  }

  const supabase = createClient()
  const { data } = await supabase
    .from('courses')
    .select('id, title, price, slug, is_vip')
    .in('id', courseIds)
    .eq('published', true)

  const courses = ((data ?? []) as unknown as CourseRow[]).map((course) => ({
    id: course.id,
    title: course.title,
    slug: course.slug,
    isVip: course.is_vip,
    price: course.price,
    priceCents: Math.round((course.price ?? 0) * 100),
    canBuy: !course.is_vip && Boolean(course.price && course.price > 0),
  }))

  return NextResponse.json({
    courses,
    totalCents: courses.reduce((sum, course) => sum + (course.canBuy ? course.priceCents : 0), 0),
  })
}
