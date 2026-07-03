/**
 * Lógica de emissão de certificado reutilizável.
 * Pode ser chamada tanto pela rota HTTP /api/certificate/generate
 * quanto internamente pelo trigger de conclusão de curso (progress/route.ts),
 * sem depender de cookies de autenticação.
 */

import { createServiceClient } from '@/lib/supabase/service'
import { generateCertificatePdf, uploadCertificatePdf } from '@/lib/certificate-generator'
import { sendEmail } from '@/lib/resend'
import { CertificadoEmail } from '@/emails/CertificadoEmail'

interface IssueCertificateParams {
  userId: string
  userEmail: string | null
  userName: string
  courseId: string
}

interface IssueCertificateResult {
  certificateId: string
  pdfUrl: string | null
  alreadyExists: boolean
  error: string | null
}

export async function issueCertificate(
  params: IssueCertificateParams
): Promise<IssueCertificateResult> {
  const { userId, userEmail, userName, courseId } = params
  const supabase = createServiceClient()

  // Idempotência — não emitir duplicata
  const { data: existing } = await supabase
    .from('certificates')
    .select('id, pdf_url')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle()

  if (existing) {
    return {
      certificateId: (existing as { id: string }).id,
      pdfUrl: (existing as { id: string; pdf_url: string | null }).pdf_url,
      alreadyExists: true,
      error: null,
    }
  }

  // Buscar dados do curso
  const { data: courseData } = await supabase
    .from('courses')
    .select('id, title, certificate_enabled')
    .eq('id', courseId)
    .single()

  const course = courseData as { id: string; title: string; certificate_enabled: boolean } | null
  if (!course)
    return { certificateId: '', pdfUrl: null, alreadyExists: false, error: 'Curso não encontrado' }
  if (!course.certificate_enabled)
    return {
      certificateId: '',
      pdfUrl: null,
      alreadyExists: false,
      error: 'Curso não emite certificado',
    }

  // Melhor nota no quiz final (se houver)
  const { data: quizScores } = await supabase
    .from('quiz_attempts')
    .select('score, quizzes!inner(course_id)')
    .eq('user_id', userId)
    .eq('passed', true)
    .eq('quizzes.course_id', courseId)

  const scores = (quizScores ?? []) as Array<{ score: number }>
  const bestScore = scores.length > 0 ? Math.max(...scores.map((s) => s.score)) : 10.0

  // Carga horária estimada
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

  // Template de certificado padrão
  const { data: templateData } = await supabase
    .from('certificate_templates')
    .select('*')
    .eq('is_default', true)
    .maybeSingle()

  const uuid = crypto.randomUUID()
  const issuedAt = new Date()

  // Gerar PDF (falha silenciosa — registro é criado mesmo sem PDF)
  let pdfUrl: string | null = null
  try {
    const pdfBytes = await generateCertificatePdf({
      userName,
      courseName: course.title,
      courseHours,
      score: bestScore,
      issuedAt,
      uuid,
      userId,
      template: templateData,
    })
    pdfUrl = await uploadCertificatePdf(pdfBytes, userId, uuid)
  } catch (e) {
    console.error('[issueCertificate] Falha ao gerar PDF:', e)
  }

  // Inserir registro
  const { data: certData, error: insertError } = await supabase
    .from('certificates')
    .insert({
      id: uuid,
      user_id: userId,
      course_id: courseId,
      issued_at: issuedAt.toISOString(),
      pdf_url: pdfUrl,
      verified: true,
    } as never)
    .select('id, pdf_url')
    .single()

  if (insertError) {
    return { certificateId: '', pdfUrl: null, alreadyExists: false, error: insertError.message }
  }

  const cert = certData as { id: string; pdf_url: string | null }

  // E-mail de certificado (fire-and-forget)
  if (userEmail) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ead.fabioborgesoficial.com.br'
    void sendEmail(
      userEmail,
      `Seu certificado de "${course.title}" está pronto!`,
      CertificadoEmail({
        name: userName,
        courseName: course.title,
        certificadosUrl: `${appUrl}/dashboard/certificados`,
        certificateUrl: `${appUrl}/certificado/${uuid}`,
      })
    )
  }

  return { certificateId: cert.id, pdfUrl: cert.pdf_url, alreadyExists: false, error: null }
}
