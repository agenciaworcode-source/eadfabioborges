import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface AttemptRow {
  id: string
  user_id: string
  quiz_id: string
  score: number
  answers: Record<string, string>
  passed: boolean
  created_at: string
}

export async function GET(
  _request: Request,
  { params }: { params: { quizId: string } }
) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  // Última tentativa (mais recente)
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('id, user_id, quiz_id, score, answers, passed, created_at')
    .eq('user_id', user.id)
    .eq('quiz_id', params.quizId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ attempt: null, attemptsUsed: 0 })
  }

  // Contar total de tentativas
  const { count } = await supabase
    .from('quiz_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('quiz_id', params.quizId)

  const attempt = data as unknown as AttemptRow

  return NextResponse.json({ attempt, attemptsUsed: count ?? 1 })
}
