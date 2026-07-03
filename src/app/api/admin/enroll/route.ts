import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createEnrollmentWithAccessWindow } from '@/lib/enrollments/access'
import { sendEmail } from '@/lib/resend'
import { MatriculaAdminEmail } from '@/emails/MatriculaAdminEmail'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ead.fabioborgesoficial.com.br'

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
  // Auth check via user client (respeita JWT)
  const authClient = createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { data: profileData } = await authClient
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
    return NextResponse.json({ error: 'Forneça userEmail ou userId' }, { status: 400 })
  }

  // Service client bypassa RLS para operações administrativas
  const supabase = createServiceClient()

  // Resolve userId a partir do e-mail se necessário
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

  // Idempotência: não duplicar matrícula existente
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

  // Criar matrícula usando service client (bypassa RLS)
  const enrollment = await createEnrollmentWithAccessWindow(supabase, {
    userId: targetUserId!,
    courseId,
  })

  if (enrollment.error) {
    return NextResponse.json({ error: enrollment.error }, { status: 500 })
  }

  // Disparar e-mail de matrícula manual
  const { data: userProfile } = await supabase
    .from('users')
    .select('name, email')
    .eq('id', targetUserId!)
    .maybeSingle()
  const { data: courseData } = await supabase
    .from('courses')
    .select('title, slug')
    .eq('id', courseId)
    .maybeSingle()
  type ProfileRow = { name: string; email: string }
  type CourseRow = { title: string; slug: string }
  const profile = userProfile as unknown as ProfileRow | null
  const course = courseData as unknown as CourseRow | null
  if (profile?.email && course) {
    void sendEmail(
      profile.email,
      `Você foi matriculado(a) em "${course.title}"`,
      MatriculaAdminEmail({
        name: profile.name ?? profile.email.split('@')[0],
        courseName: course.title,
        courseSlug: course.slug,
        appUrl: APP_URL,
      })
    )
  }

  return NextResponse.json({
    enrollmentId: enrollment.enrollmentId,
    userId: targetUserId,
    courseId,
    expiresAt: enrollment.expiresAt,
  })
}
