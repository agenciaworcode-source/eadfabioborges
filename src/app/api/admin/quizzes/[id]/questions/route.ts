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

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { error, supabase } = await requireAdmin()
  if (error) return error

  const body = await req.json() as {
    type?: 'multiple_choice' | 'true_false' | 'open'
    body?: string
    options?: string[]
    correct_answer?: string | null
  }

  if (!body.body?.trim()) {
    return NextResponse.json({ error: 'Enunciado obrigatório' }, { status: 400 })
  }

  const { data, error: dbError } = await supabase!
    .from('questions')
    .insert({
      quiz_id: params.id,
      type: body.type ?? 'multiple_choice',
      body: body.body.trim(),
      options: body.options ?? [],
      correct_answer: body.correct_answer ?? null,
    } as never)
    .select('id, quiz_id, type, body, options, correct_answer')
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
