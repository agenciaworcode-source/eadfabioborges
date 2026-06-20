import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

function buildSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

async function generateUniqueSlug(
  supabase: SupabaseClient,
  baseSlug: string
): Promise<string> {
  let slug = baseSlug
  let suffix = 1
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
    if (!data) return slug
    suffix++
    slug = `${baseSlug}-${suffix}`
  }
}

interface CourseRow {
  id: string
  title: string
  description: string | null
  price: number | null
  is_vip: boolean | null
  level: string | null
  category: string | null
}

export async function POST(
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

  const { data: source, error: fetchError } = await supabase
    .from('courses')
    .select('id, title, description, price, is_vip, level, category')
    .eq('id', params.id)
    .single()

  if (fetchError || !source) {
    return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })
  }

  const src = source as unknown as CourseRow
  const newTitle = `Cópia de ${src.title}`
  const baseSlug = buildSlug(newTitle)
  const slug = await generateUniqueSlug(supabase, baseSlug)
  const newId = crypto.randomUUID()

  const { error: insertError } = await supabase
    .from('courses')
    .insert({
      id: newId,
      slug,
      title: newTitle,
      description: src.description ?? '',
      price: src.price ?? 0,
      is_vip: src.is_vip ?? false,
      published: false,
      level: src.level ?? 'todos',
      category: src.category ?? null,
    } as never)

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ courseId: newId, slug }, { status: 201 })
}
