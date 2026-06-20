import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), supabase: null }
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if ((profile as { role: string } | null)?.role !== 'admin') return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), supabase: null }
  return { error: null, supabase }
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { error, supabase } = await requireAdmin()
  if (error) return error

  const { data, error: dbError } = await supabase!
    .from('quizzes')
    .select('id, lesson_id, title, pass_score, attempts_allowed, questions(id, quiz_id, type, body, options, correct_answer)')
    .eq('lesson_id', params.id)
    .maybeSingle()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data ?? null)
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { error, supabase } = await requireAdmin()
  if (error) return error

  const body = await req.json() as { title?: string; pass_score?: number; attempts_allowed?: number }
  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'Título obrigatório' }, { status: 400 })
  }

  const { data, error: dbError } = await supabase!
    .from('quizzes')
    .insert({
      lesson_id: params.id,
      title: body.title.trim(),
      pass_score: body.pass_score ?? 70,
      attempts_allowed: body.attempts_allowed ?? 3,
    } as never)
    .select('id, lesson_id, title, pass_score, attempts_allowed')
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
