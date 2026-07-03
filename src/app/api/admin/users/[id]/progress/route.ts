import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { getAdminUserProgress } from '@/lib/admin/student-progress'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const { supabase, response } = await requireAdmin()
  if (response) return response

  const { data: targetUser, error: targetUserError } = await supabase
    .from('users')
    .select('id')
    .eq('id', params.id)
    .maybeSingle()

  if (targetUserError) {
    return NextResponse.json({ error: targetUserError.message }, { status: 500 })
  }

  if (!targetUser) {
    return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 })
  }

  try {
    const progress = await getAdminUserProgress(supabase, params.id)
    return NextResponse.json(progress)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao carregar progresso'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
