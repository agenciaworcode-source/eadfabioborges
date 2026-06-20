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
    .from('assignments')
    .select('id, lesson_id, title, instructions, deadline')
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

  const body = await req.json() as { title?: string; instructions?: string; deadline?: string | null }
  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'Título obrigatório' }, { status: 400 })
  }

  const { data, error: dbError } = await supabase!
    .from('assignments')
    .insert({
      lesson_id: params.id,
      title: body.title.trim(),
      instructions: body.instructions?.trim() ?? null,
      deadline: body.deadline ?? null,
    } as never)
    .select('id, lesson_id, title, instructions, deadline')
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
