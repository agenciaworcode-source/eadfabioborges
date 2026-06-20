import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createEnrollmentWithAccessWindow } from '@/lib/enrollments/access'

const bodySchema = z.object({
  userEmail: z.string().email().optional(),
  userId: z.string().uuid().optional(),
  courseId: z.string().uuid(),
})

interface UserRow {
  id: string
}

interface EnrollRow {
  id: string
}

export async function POST(request: Request) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  // Verify admin
  const { data: profileData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if ((profileData as { role: string } | null)?.role !== 'admin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
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

  const { userEmail, userId: userIdParam, courseId } = parsed.data

  if (!userEmail && !userIdParam) {
    return NextResponse.json(
      { error: 'Forneça userEmail ou userId' },
      { status: 400 }
    )
  }

  // Resolve userId from email if needed
  let targetUserId = userIdParam
  if (!targetUserId && userEmail) {
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .maybeSingle()

    const found = userData as unknown as UserRow | null
    if (!found) {
      return NextResponse.json(
        { error: `Usuário com e-mail "${userEmail}" não encontrado` },
        { status: 404 }
      )
    }
    targetUserId = found.id
  }

  // Idempotency: check existing enrollment
  const { data: existingData } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', targetUserId!)
    .eq('course_id', courseId)
    .maybeSingle()

  const existing = existingData as unknown as EnrollRow | null

  if (existing) {
    return NextResponse.json({
      enrollmentId: existing.id,
      userId: targetUserId,
      courseId,
      already_exists: true,
    })
  }

  // Create enrollment
  const enrollmentId = crypto.randomUUID()

  const enrollment = await createEnrollmentWithAccessWindow(supabase, {
    enrollmentId,
    userId: targetUserId!,
    courseId,
  })

  if (enrollment.error) {
    return NextResponse.json({ error: enrollment.error }, { status: 500 })
  }

  return NextResponse.json({
    enrollmentId: enrollment.enrollmentId,
    userId: targetUserId,
    courseId,
    expiresAt: enrollment.expiresAt,
  })
}
