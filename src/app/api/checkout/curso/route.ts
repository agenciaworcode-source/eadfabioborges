import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCheckoutProvider } from '@/lib/checkout'

const bodySchema = z.object({
  courseId: z.string().uuid(),
})

interface CourseRow {
  id: string
  title: string
  price: number | null
  slug: string
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

  const { courseId } = parsed.data

  const { data: courseData } = await supabase
    .from('courses')
    .select('id, title, price, slug')
    .eq('id', courseId)
    .eq('published', true)
    .single()

  if (!courseData) {
    return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })
  }

  const course = courseData as unknown as CourseRow
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  try {
    const { url } = await getCheckoutProvider().createCourseCheckout({
      courseId: course.id,
      courseTitle: course.title,
      userId: user.id,
      userEmail: user.email!,
      priceAmountCents: Math.round((course.price ?? 0) * 100),
      successUrl: `${baseUrl}/checkout/sucesso?course=${course.slug}`,
      cancelUrl: `${baseUrl}/cursos/${course.slug}`,
    })

    return NextResponse.json({ url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao criar sessão de checkout'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
