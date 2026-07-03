import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin(supabase: ReturnType<typeof createClient>) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()

  if ((profile as { role?: string } | null)?.role !== 'admin') return null
  return user
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const admin = await requireAdmin(supabase)
  if (!admin) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const body = (await request.json()) as Record<string, unknown>

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (typeof body.price_monthly === 'number')
    updates.price_monthly = Math.round(body.price_monthly * 100)
  if (typeof body.price_annual === 'number')
    updates.price_annual = Math.round(body.price_annual * 100)
  if (typeof body.name === 'string') updates.name = body.name.trim()
  if (typeof body.description === 'string') updates.description = body.description.trim()
  if (typeof body.badge === 'string') updates.badge = body.badge.trim()
  if (typeof body.audience === 'string') updates.audience = body.audience.trim()
  if (Array.isArray(body.features)) updates.features = body.features
  if (Array.isArray(body.billing_options)) updates.billing_options = body.billing_options
  if (typeof body.hierarchy_level === 'number') updates.hierarchy_level = body.hierarchy_level
  if (typeof body.is_featured === 'boolean') updates.is_featured = body.is_featured
  if (typeof body.is_active === 'boolean') updates.is_active = body.is_active
  if (typeof body.includes_all_courses === 'boolean')
    updates.includes_all_courses = body.includes_all_courses

  const sb = supabase as unknown as {
    from: (t: string) => {
      update: (u: Record<string, unknown>) => {
        eq: (
          c: string,
          v: string
        ) => {
          select: () => {
            single: () => Promise<{
              data: unknown
              error: { message: string } | null
            }>
          }
        }
      }
    }
  }

  const { data, error } = await sb
    .from('plans')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ plan: data })
}
