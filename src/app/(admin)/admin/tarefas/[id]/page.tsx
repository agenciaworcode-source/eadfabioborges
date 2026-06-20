import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SubmissionsTable } from './SubmissionsTable'

interface SubmissionRow {
  id: string
  user_id: string
  assignment_id: string
  file_url: string | null
  grade: number | null
  feedback: string | null
  graded_at: string | null
  created_at: string
  users: { name: string; email: string } | null
}

interface AssignmentRow {
  id: string
  title: string
  instructions: string | null
  deadline: string | null
  lesson_id: string
}

export default async function AdminTarefaPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  const { data: assignmentData, error: assignmentError } = await supabase
    .from('assignments')
    .select('id, title, instructions, deadline, lesson_id')
    .eq('id', params.id)
    .maybeSingle()

  if (assignmentError || !assignmentData) {
    notFound()
  }

  const assignment = assignmentData as unknown as AssignmentRow

  const { data: submissionsData } = await supabase
    .from('submissions')
    .select('id, user_id, assignment_id, file_url, grade, feedback, graded_at, created_at, users(name, email)')
    .eq('assignment_id', params.id)
    .order('created_at', { ascending: false })

  const submissions = (submissionsData ?? []) as unknown as SubmissionRow[]
  const pending = submissions.filter(s => s.grade === null).length
  const graded = submissions.length - pending

  return (
    <>
      <div className="topbar">
        <div className="crumb">
          <a href="/admin">Admin</a> <span>›</span>
          <a href="/admin/cursos">Cursos</a> <span>›</span>
          <b>Tarefa</b>
        </div>
        <div className="avatar sm" style={{ background: 'var(--ink)' }}>FB</div>
      </div>

      <div className="content wide">
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '22px', marginBottom: '6px' }}>{assignment.title}</h1>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="muted" style={{ fontSize: '13px' }}>
              {submissions.length} entrega{submissions.length !== 1 ? 's' : ''}
            </span>
            {pending > 0 && (
              <span className="badge" style={{ background: '#fdeede', color: '#b5790f', fontSize: '11px' }}>
                {pending} pendente{pending !== 1 ? 's' : ''}
              </span>
            )}
            {graded > 0 && (
              <span className="badge green dot" style={{ fontSize: '11px' }}>
                {graded} corrigida{graded !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {assignment.instructions && (
            <p className="muted" style={{ fontSize: '13px', marginTop: '8px', maxWidth: '600px' }}>
              {assignment.instructions}
            </p>
          )}
          {assignment.deadline && (
            <p className="muted" style={{ fontSize: '12px', marginTop: '4px' }}>
              Prazo: {new Date(assignment.deadline).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>

        <div className="card card-pad">
          <SubmissionsTable submissions={submissions} />
        </div>
      </div>
    </>
  )
}
