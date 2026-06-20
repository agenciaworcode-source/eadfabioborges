import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  instructions: z.string().nullable().optional(),
  deadline: z.string().datetime({ offset: true }).nullable().optional(),
}).strict()

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), supabase: null }
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if ((profile as { role: string } | null)?.role !== 'admin') return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), supabase: null }
  return { error: null, supabase }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { error, supabase } = await requireAdmin()
  if (error) return error

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error: dbError } = await supabase!
    .from('assignments')
    .update(parsed.data as never)
    .eq('id', params.id)
    .select('id, lesson_id, title, instructions, deadline')
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { error, supabase } = await requireAdmin()
  if (error) return error

  const { error: dbError } = await supabase!
    .from('assignments')
    .delete()
    .eq('id', params.id)

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
