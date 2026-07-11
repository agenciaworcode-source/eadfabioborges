import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AdminStudentDetail } from '@/components/admin/AdminStudentDetail'

interface AdminStudentPageProps {
  params: {
    userId: string
  }
}

export default async function AdminAlunoDetailPage({ params }: AdminStudentPageProps) {
  const supabase = createClient()

  const { data: userData } = await supabase
    .from('users')
    .select('id, name')
    .eq('id', params.userId)
    .maybeSingle()

  if (!userData) {
    return (
      <div className="content wide">
        <div className="card card-pad">
          <h1 style={{ fontSize: '22px', marginBottom: '8px' }}>Aluno não encontrado</h1>
          <p className="muted">O registro solicitado não existe ou foi removido.</p>
          <Link className="btn btn-ghost btn-sm" href="/admin/alunos" style={{ marginTop: '16px' }}>
            <ChevronLeft size={16} />
            Voltar para alunos
          </Link>
        </div>
      </div>
    )
  }

  const { data: coursesData } = await supabase
    .from('courses')
    .select('id, title')
    .eq('published', true)
    .order('title')

  const courseOptions = ((coursesData ?? []) as Array<{ id: string; title: string }>).map((c) => ({
    id: c.id,
    title: c.title,
  }))

  return (
    <div className="content wide">
      <div className="flex between aic" style={{ gap: '16px', flexWrap: 'wrap', marginBottom: 16 }}>
        <div className="crumb">
          <Link href="/admin/alunos">Alunos</Link>
          <span>›</span>
          <b>Detalhe</b>
        </div>
        <Link className="btn btn-ghost btn-sm" href="/admin/alunos">
          <ChevronLeft size={16} />
          Voltar
        </Link>
      </div>

      <AdminStudentDetail userId={params.userId} courseOptions={courseOptions} />
    </div>
  )
}
