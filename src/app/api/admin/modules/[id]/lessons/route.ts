import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { normalizeVimeoInput } from '@/lib/vimeo'

const bodySchema = z.object({
  title: z.string().min(1, 'Título obrigatório').max(255),
  type: z.enum(['video', 'text', 'pdf', 'embed']).optional().default('video'),
  vimeo_id: z.string().optional().nullable(),
  youtube_url: z.string().optional().nullable(),
  video_thumbnail_url: z.string().optional().nullable(),
  completion_percent: z.number().int().min(0).max(100).optional(),
  content_body: z.string().optional().nullable(),
  embed_url: z.string().optional().nullable(),
  pdf_url: z.string().optional().nullable(),
  duration_secs: z.number().int().nonnegative().optional(),
  order: z.number().int().nonnegative().optional(),
  is_free_preview: z.boolean().optional(),
})

async function requireAdmin() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), supabase: null }
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if ((profile as { role: string } | null)?.role !== 'admin')
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), supabase: null }
  return { error: null, supabase }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { error, supabase } = await requireAdmin()
  if (error) return error

  const parsed = bodySchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' },
      { status: 400 }
    )
  }
  const body = parsed.data

  const { data, error: dbError } = await supabase!
    .from('lessons')
    .insert({
      module_id: params.id,
      title: body.title,
      type: body.type,
      vimeo_id: body.type === 'video' ? normalizeVimeoInput(body.vimeo_id) : null,
      youtube_url: body.type === 'video' ? (body.youtube_url ?? null) : null,
      video_thumbnail_url: body.type === 'video' ? (body.video_thumbnail_url ?? null) : null,
      completion_percent: body.type === 'video' ? (body.completion_percent ?? 0) : 0,
      content_body: body.content_body ?? null,
      embed_url: body.embed_url ?? null,
      pdf_url: body.pdf_url ?? null,
      duration_secs: body.duration_secs ?? 0,
      order: body.order ?? 0,
      is_free_preview: body.is_free_preview ?? false,
    } as never)
    .select(
      'id, module_id, title, type, vimeo_id, youtube_url, video_thumbnail_url, completion_percent, content_body, embed_url, pdf_url, duration_secs, order, is_free_preview'
    )
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
