import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { normalizeVimeoInput } from '@/lib/vimeo'

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  type: z.enum(['video', 'text', 'pdf', 'embed']).optional(),
  vimeo_id: z.string().nullable().optional(),
  content_body: z.string().nullable().optional(),
  embed_url: z.string().nullable().optional(),
  pdf_url: z.string().nullable().optional(),
  duration_secs: z.number().int().min(0).optional(),
  order: z.number().int().min(0).optional(),
  is_free_preview: z.boolean().optional(),
}).strict()

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
    .from('lessons')
    .select('id, module_id, title, type, vimeo_id, content_body, embed_url, pdf_url, duration_secs, order, is_free_preview')
    .eq('id', params.id)
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data)
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

  const updates = {
    ...parsed.data,
    ...(parsed.data.vimeo_id !== undefined
      ? { vimeo_id: normalizeVimeoInput(parsed.data.vimeo_id) }
      : {}),
  }

  const { data, error: dbError } = await supabase!
    .from('lessons')
    .update(updates as never)
    .eq('id', params.id)
    .select('id, module_id, title, type, vimeo_id, content_body, embed_url, pdf_url, duration_secs, order, is_free_preview')
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
    .from('lessons')
    .delete()
    .eq('id', params.id)

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
