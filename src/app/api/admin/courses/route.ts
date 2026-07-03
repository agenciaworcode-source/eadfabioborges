import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

const bodySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  price: z.number().min(0).optional(),
  published: z.boolean().optional(),
  isVip: z.boolean().optional(),
  level: z.enum(['iniciante', 'intermediario', 'avancado', 'todos']).optional(),
  category: z.string().optional(),
  accessType: z.enum(['free', 'paid', 'plan', 'manual']).optional(),
  certificateEnabled: z.boolean().optional(),
  accessDays: z.number().int().positive().nullable().optional(),
})

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

async function generateUniqueSlug(supabase: SupabaseClient, baseSlug: string): Promise<string> {
  let slug = baseSlug
  // Teto de tentativas para evitar loop infinito em caso de anomalia de dados
  for (let suffix = 1; suffix <= 50; suffix++) {
    const { data } = await supabase.from('courses').select('id').eq('slug', slug).maybeSingle()
    if (!data) return slug
    slug = `${baseSlug}-${suffix + 1}`
  }
  // Fallback garantido: sufixo aleatório
  return `${baseSlug}-${Date.now().toString(36)}`
}

export async function POST(request: Request) {
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

  const {
    title,
    description,
    price,
    published,
    isVip,
    level,
    category,
    accessType,
    certificateEnabled,
    accessDays,
  } = parsed.data
  const baseSlug = buildSlug(title)
  const slug = await generateUniqueSlug(supabase, baseSlug)
  const courseId = crypto.randomUUID()

  const { data: courseData, error: insertError } = await supabase
    .from('courses')
    .insert({
      id: courseId,
      slug,
      title,
      description: description ?? '',
      price: price ?? 0,
      is_vip: isVip ?? false,
      published: published ?? true,
      level: level ?? 'todos',
      category: category ?? null,
      access_type: accessType ?? 'paid',
      certificate_enabled: certificateEnabled ?? true,
      access_days: accessDays ?? null,
    } as never)
    .select(
      'id, slug, title, description, price, published, is_vip, thumbnail_url, level, category, access_type, certificate_enabled, access_days'
    )
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ courseId, slug, course: courseData }, { status: 201 })
}
