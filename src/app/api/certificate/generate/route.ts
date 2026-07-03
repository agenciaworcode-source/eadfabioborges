import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { issueCertificate } from '@/lib/certificates/issue'
import { sendEmail } from '@/lib/resend'
import { CertificadoEmail } from '@/emails/CertificadoEmail'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ead.fabioborgesoficial.com.br'

const bodySchema = z.object({
  enrollmentId: z.string().uuid().optional(),
  courseId: z.string().uuid().optional(),
})

function statusForCertificateError(error: string) {
  if (/nao emite certificado|não emite certificado/i.test(error)) return 403
  if (/nao encontrado|não encontrado/i.test(error)) return 404
  return 500
}

interface EnrollmentRow {
  id: string
  user_id: string
  course_id: string
  status: string
}

export async function POST(request: Request) {
  const supabase = createClient()
  const service = createServiceClient()

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

  let courseId = courseIdParam

  // Resolver courseId a partir do enrollmentId
  if (enrollmentId) {
    const { data: enrollment } = await service
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
      return NextResponse.json({ error: 'Curso ainda não concluído' }, { status: 422 })
    }
    courseId = enr.course_id
  }

  if (!courseId) {
    return NextResponse.json({ error: 'Forneça enrollmentId ou courseId' }, { status: 400 })
  }

  // Se veio só courseId (sem enrollmentId), verificar que o aluno concluiu
  if (courseIdParam && !enrollmentId) {
    const { data: enrollment } = await service
      .from('enrollments')
      .select('id, status')
      .eq('course_id', courseId)
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .maybeSingle()

    if (!enrollment) {
      return NextResponse.json({ error: 'Curso ainda não concluído' }, { status: 422 })
    }
  }

  // Buscar nome do aluno
  const { data: profileData } = await service
    .from('users')
    .select('name')
    .eq('id', user.id)
    .maybeSingle()

  const userName =
    (profileData as { name: string } | null)?.name ||
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split('@')[0] ||
    'Aluno'

  const result = await issueCertificate({
    userId: user.id,
    userEmail: user.email ?? null,
    userName,
    courseId,
  })

  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: statusForCertificateError(result.error) }
    )
  }

  // Disparar e-mail de certificado apenas quando emitido pela primeira vez
  if (!result.alreadyExists && user.email) {
    const { data: courseData } = await service
      .from('courses')
      .select('title, slug')
      .eq('id', courseId)
      .maybeSingle()
    const c = courseData as { title: string; slug: string } | null
    if (c) {
      void sendEmail(
        user.email,
        `Seu certificado de "${c.title}" está pronto!`,
        CertificadoEmail({
          name: userName,
          courseName: c.title,
          certificadosUrl: `${APP_URL}/dashboard/certificados`,
          certificateUrl: `${APP_URL}/certificado/${result.certificateId}`,
        })
      )
    }
  }

  return NextResponse.json({
    certificateId: result.certificateId,
    pdfUrl: result.pdfUrl,
    uuid: result.certificateId,
    already_exists: result.alreadyExists,
  })
}
