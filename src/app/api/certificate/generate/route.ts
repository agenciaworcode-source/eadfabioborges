import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import {
  generateCertificatePdf,
  uploadCertificatePdf,
} from '@/lib/certificate-generator'
import { sendEmail } from '@/lib/resend'
import { CertificadoEmail } from '@/emails/CertificadoEmail'

const bodySchema = z.object({
  enrollmentId: z.string().uuid().optional(),
  courseId: z.string().uuid().optional(),
})

interface EnrollmentRow {
  id: string
  user_id: string
  course_id: string
  status: string
}

interface CourseRow {
  id: string
  title: string
}

interface CertRow {
  id: string
  pdf_url: string | null
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

  const { enrollmentId, courseId: courseIdParam } = parsed.data

  // Resolve course_id from enrollmentId or direct courseId
  let courseId = courseIdParam
  if (enrollmentId) {
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id, user_id, course_id, status')
      .eq('id', enrollmentId)
      .eq('user_id', user.id)
      .single()

    const enr = enrollment as unknown as EnrollmentRow | null
    if (!enr) {
      return NextResponse.json({ error: 'Matrícula não encontrada' }, { status: 404 })
    }
    if (enr.status !== 'completed') {
      return NextResponse.json(
        { error: 'Curso ainda não concluído' },
        { status: 422 }
      )
    }
    courseId = enr.course_id
  }

  if (!courseId) {
    return NextResponse.json(
      { error: 'Forneça enrollmentId ou courseId' },
      { status: 400 }
    )
  }

  // Idempotency: check if certificate already exists for this user+course
  const { data: existing } = await supabase
    .from('certificates')
    .select('id, pdf_url')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle()

  const existingCert = existing as unknown as CertRow | null

  if (existingCert) {
    return NextResponse.json({
      certificateId: existingCert.id,
      pdfUrl: existingCert.pdf_url,
      uuid: existingCert.id,
      already_exists: true,
    })
  }

  // Fetch course data
  const { data: courseData } = await supabase
    .from('courses')
    .select('id, title')
    .eq('id', courseId)
    .single()

  const course = courseData as unknown as CourseRow | null
  if (!course) {
    return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })
  }

  // Fetch user name
  const { data: profileData } = await supabase
    .from('users')
    .select('name')
    .eq('id', user.id)
    .single()

  const profile = profileData as { name: string } | null
  const userName =
    profile?.name ||
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split('@')[0] ||
    'Aluno'

  // Fetch best quiz score for this course
  const { data: quizScores } = await supabase
    .from('quiz_attempts')
    .select('score')
    .eq('user_id', user.id)
    .eq('passed', true)

  const scores = (quizScores ?? []) as Array<{ score: number }>
  const bestScore =
    scores.length > 0 ? Math.max(...scores.map((s) => s.score)) : 10.0

  // Estimate course hours from lesson durations
  const { data: modulesData } = await supabase
    .from('modules')
    .select('id, lessons(duration_secs)')
    .eq('course_id', courseId)

  type ModuleWithLessons = { id: string; lessons: Array<{ duration_secs: number }> }
  const modules = (modulesData ?? []) as unknown as ModuleWithLessons[]
  const totalSecs = modules
    .flatMap((m) => m.lessons ?? [])
    .reduce((sum, l) => sum + (l.duration_secs ?? 0), 0)
  const courseHours = Math.max(1, Math.round(totalSecs / 3600))

  // Generate certificate UUID
  const uuid = crypto.randomUUID()
  const issuedAt = new Date()

  // Generate PDF
  let pdfUrl: string | null = null
  try {
    const pdfBytes = await generateCertificatePdf({
      userName,
      courseName: course.title,
      courseHours,
      score: bestScore,
      issuedAt,
      uuid,
      userId: user.id,
    })
    pdfUrl = await uploadCertificatePdf(pdfBytes, user.id, uuid)
  } catch {
    // PDF generation is non-blocking — cert record is still created
  }

  // Insert certificate record
  const { data: certData, error: insertError } = await supabase
    .from('certificates')
    .insert({
      id: uuid,
      user_id: user.id,
      course_id: courseId,
      issued_at: issuedAt.toISOString(),
      pdf_url: pdfUrl,
      verified: true,
    } as never)
    .select('id, pdf_url')
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  const cert = certData as unknown as CertRow

  // Disparo de email de certificado emitido (fire-and-forget)
  if (user.email) {
    void sendEmail(
      user.email,
      `Seu certificado de "${course.title}" está pronto!`,
      CertificadoEmail({
        name: userName,
        courseName: course.title,
        certificadosUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/certificados`,
        certificateUrl: `${process.env.NEXT_PUBLIC_APP_URL}/certificado/${uuid}`,
      }),
    )
  }

  return NextResponse.json({
    certificateId: cert.id,
    pdfUrl: cert.pdf_url,
    uuid: cert.id,
  })
}
