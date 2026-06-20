import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/resend'
import { TarefaCorrigidaEmail } from '@/emails/TarefaCorrigidaEmail'

const gradeSchema = z.object({
  grade: z.number().min(0).max(100),
  feedback: z.string(),
})

export async function PATCH(
  request: Request,
  { params }: { params: { submissionId: string } }
) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  // Verificar role admin
  const { data: profileData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const profile = profileData as { role: string } | null

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = gradeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { grade, feedback } = parsed.data

  const { error } = await supabase
    .from('submissions')
    .update({
      grade,
      feedback,
      graded_at: new Date().toISOString(),
    } as never)
    .eq('id', params.submissionId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Disparo de email de tarefa corrigida (fire-and-forget)
  const { data: subData } = await supabase
    .from('submissions')
    .select('user_id, users(name, email), assignments(title)')
    .eq('id', params.submissionId)
    .single()

  type SubWithJoins = {
    user_id: string
    users: { name: string; email: string } | null
    assignments: { title: string } | null
  }

  const sub = subData as unknown as SubWithJoins | null
  if (sub?.users?.email) {
    void sendEmail(
      sub.users.email,
      `Sua tarefa "${sub.assignments?.title ?? 'Tarefa'}" foi corrigida`,
      TarefaCorrigidaEmail({
        name: sub.users.name,
        assignmentTitle: sub.assignments?.title ?? 'Tarefa',
        grade,
        feedback,
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      }),
    )
  }

  return NextResponse.json({ updated: true })
}
