import Link from 'next/link'
import { ChevronLeft, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { StudentProgressSection } from '@/components/admin/StudentProgressSection'

interface AdminStudentPageProps {
  params: {
    userId: string
  }
}

export default async function AdminAlunoDetailPage({ params }: AdminStudentPageProps) {
  const supabase = createClient()

  const { data: userData } = await supabase
    .from('users')
    .select('id, name, email, plan, created_at')
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

  return (
    <div className="content wide">
      <div className="flex between aic" style={{ gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <div className="crumb" style={{ marginBottom: '8px' }}>
            <Link href="/admin/alunos">Admin</Link>
            <span>›</span>
            <b>Aluno</b>
          </div>
          <h1 style={{ fontSize: '26px' }}>{userData.name}</h1>
          <p className="muted" style={{ marginTop: '4px' }}>
            {userData.email} · plano {(userData.plan ?? 'free').toUpperCase()}
          </p>
        </div>

        <Link className="btn btn-ghost btn-sm" href="/admin/alunos">
          <ChevronLeft size={16} />
          Voltar
        </Link>
      </div>

      <div className="card card-pad" style={{ marginTop: '18px' }}>
        <div className="flex between aic" style={{ gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: '18px', marginBottom: '4px' }}>Perfil do aluno</h2>
            <p className="muted" style={{ fontSize: '13px' }}>
              Dados de matrícula, acesso e progresso em um único lugar.
            </p>
          </div>
          <Link className="btn btn-ghost btn-sm" href={`/admin/alunos?highlight=${params.userId}`}>
            <Eye size={16} />
            Ver na lista
          </Link>
        </div>

        <StudentProgressSection userId={params.userId} />
      </div>
    </div>
  )
}
