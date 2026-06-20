import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const reorderSchema = z.object({
  order: z.array(z.object({
    id: z.string().uuid(),
    order: z.number().int().min(0),
  })).min(1),
})

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

  const parsed = reorderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
  }

  const results = await Promise.all(
    parsed.data.order.map(({ id, order }) =>
      supabase!
        .from('modules')
        .update({ order } as never)
        .eq('id', id)
        .eq('course_id', params.id)
    )
  )

  const failed = results.find(r => r.error)
  if (failed?.error) {
    return NextResponse.json({ error: failed.error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, updated: parsed.data.order.length })
}
