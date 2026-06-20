import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface CertRow {
  id: string
  user_id: string
  course_id: string
  issued_at: string
  pdf_url: string | null
  verified: boolean
  users: { name: string } | null
  courses: { title: string } | null
}

export async function GET(
  _request: Request,
  { params }: { params: { uuid: string } }
) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('certificates')
    .select('id, user_id, course_id, issued_at, pdf_url, verified, users(name), courses(title)')
    .eq('id', params.uuid)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Certificado não encontrado' }, { status: 404 })
  }

  const cert = data as unknown as CertRow

  return NextResponse.json({
    id: cert.id,
    studentName: cert.users?.name ?? null,
    courseName: cert.courses?.title ?? null,
    issuedAt: cert.issued_at,
    verified: cert.verified,
    pdfUrl: cert.pdf_url,
  })
}
