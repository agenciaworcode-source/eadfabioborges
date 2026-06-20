import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if ((profile as { role?: string } | null)?.role !== 'admin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const body = (await request.json()) as {
    price_monthly?: number
    price_annual?: number
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (typeof body.price_monthly === 'number') {
    updates.price_monthly = Math.round(body.price_monthly * 100)
  }
  if (typeof body.price_annual === 'number') {
    updates.price_annual = Math.round(body.price_annual * 100)
  }

  const supabaseAny = supabase as unknown as {
    from: (t: string) => {
      update: (u: Record<string, unknown>) => {
        eq: (c: string, v: string) => {
          select: () => { single: () => Promise<{ data: unknown; error: { message: string } | null }> }
        }
      }
    }
  }

  const { data, error } = await supabaseAny
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
