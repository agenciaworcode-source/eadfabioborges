import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const bodySchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().min(0).optional(),
  published: z.boolean().optional(),
  is_vip: z.boolean().optional(),
  level: z.enum(['iniciante', 'intermediario', 'avancado', 'todos']).optional(),
  category: z.string().optional(),
  access_type: z.enum(['free', 'paid', 'plan', 'manual']).optional(),
  certificate_enabled: z.boolean().optional(),
  access_days: z.number().int().positive().nullable().optional(),
}).strict()

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { data: profileData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if ((profileData as { role: string } | null)?.role !== 'admin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const updates: Record<string, unknown> = {}
  if (parsed.data.title !== undefined) updates.title = parsed.data.title
  if (parsed.data.description !== undefined) updates.description = parsed.data.description
  if (parsed.data.price !== undefined) updates.price = parsed.data.price
  if (parsed.data.published !== undefined) updates.published = parsed.data.published
  if (parsed.data.is_vip !== undefined) updates.is_vip = parsed.data.is_vip
  if (parsed.data.level !== undefined) updates.level = parsed.data.level
  if (parsed.data.category !== undefined) updates.category = parsed.data.category
  if (parsed.data.access_type !== undefined) updates.access_type = parsed.data.access_type
  if (parsed.data.certificate_enabled !== undefined) updates.certificate_enabled = parsed.data.certificate_enabled
  if (parsed.data.access_days !== undefined) updates.access_days = parsed.data.access_days

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
  }

  const { data: updatedData, error: updateError } = await supabase
    .from('courses')
    .update(updates as never)
    .eq('id', params.id)
    .select('id, title, description, price, published, is_vip, slug, level, category, access_type, certificate_enabled, access_days')
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json(updatedData)
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: profileData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if ((profileData as { role: string } | null)?.role !== 'admin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const { data: existing } = await supabase
    .from('courses')
    .select('id')
    .eq('id', params.id)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })
  }

  const { error: deleteError } = await supabase
    .from('courses')
    .delete()
    .eq('id', params.id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
