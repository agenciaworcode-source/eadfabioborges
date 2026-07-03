import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin-auth'
import {
  DEFAULT_CERTIFICATE_TEMPLATE,
  normalizeHexColor,
  resolveCertificateTemplate,
} from '@/lib/certificates/templates'

const templateSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(80).default('Modelo padrão'),
  title: z.string().min(1).max(120),
  body_template: z.string().min(1).max(400),
  issuer_name: z.string().min(1).max(120),
  issuer_role: z.string().min(1).max(160),
  signature_url: z.string().url().nullable().optional(),
  logo_url: z.string().url().nullable().optional(),
  background_url: z.string().url().nullable().optional(),
  primary_color: z.string().min(4).max(20),
})

export async function GET() {
  const { supabase, response } = await requireAdmin()
  if (response) return response

  const { data, error } = await supabase
    .from('certificate_templates')
    .select('*')
    .eq('is_default', true)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    template: resolveCertificateTemplate(data),
    isFallback: !data,
  })
}

export async function PUT(request: Request) {
  const { supabase, response } = await requireAdmin()
  if (response) return response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = templateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const payload = {
    ...DEFAULT_CERTIFICATE_TEMPLATE,
    ...parsed.data,
    is_default: true,
    primary_color: normalizeHexColor(parsed.data.primary_color),
    layout_config: {},
  }

  const { data: current } = await supabase
    .from('certificate_templates')
    .select('id')
    .eq('is_default', true)
    .maybeSingle()

  const id = parsed.data.id ?? (current as { id: string } | null)?.id
  const query = id
    ? supabase
        .from('certificate_templates')
        .update(payload as never)
        .eq('id', id)
        .select('*')
        .single()
    : supabase
        .from('certificate_templates')
        .insert(payload as never)
        .select('*')
        .single()

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ template: resolveCertificateTemplate(data) })
}
