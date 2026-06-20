import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface AssignmentRow {
  id: string
  lesson_id: string
  title: string
  instructions: string | null
  deadline: string | null
}

interface SubmissionRow {
  id: string
  user_id: string
  assignment_id: string
  file_url: string | null
  grade: number | null
  feedback: string | null
  graded_at: string | null
  created_at: string
}

export async function GET(
  _request: Request,
  { params }: { params: { lessonId: string } }
) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { data: assignmentData, error: assignmentError } = await supabase
    .from('assignments')
    .select('id, lesson_id, title, instructions, deadline')
    .eq('lesson_id', params.lessonId)
    .maybeSingle()

  if (assignmentError) {
    return NextResponse.json({ error: assignmentError.message }, { status: 500 })
  }

  if (!assignmentData) {
    return NextResponse.json({ assignment: null, submission: null })
  }

  const assignment = assignmentData as unknown as AssignmentRow

  // Buscar submission do próprio aluno
  const { data: submissionData } = await supabase
    .from('submissions')
    .select('id, user_id, assignment_id, file_url, grade, feedback, graded_at, created_at')
    .eq('user_id', user.id)
    .eq('assignment_id', assignment.id)
    .maybeSingle()

  const submission = submissionData as unknown as SubmissionRow | null

  return NextResponse.json({ assignment, submission })
}
