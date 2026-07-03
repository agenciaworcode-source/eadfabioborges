import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

// GET /api/admin/coupons — listar todos os cupons
export async function GET() {
  const { supabase, response } = await requireAdmin()
  if (response) return response

  const { data, error } = await (
    supabase as unknown as {
      from: (t: string) => {
        select: (cols: string) => {
          order: (
            col: string,
            opts: { ascending: boolean }
          ) => Promise<{
            data: unknown[] | null
            error: { message: string } | null
          }>
        }
      }
    }
  )
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ coupons: data ?? [] })
}

// POST /api/admin/coupons — criar novo cupom
export async function POST(request: Request) {
  const { supabase, response } = await requireAdmin()
  if (response) return response

  const body = await request.json()
  const {
    code,
    description,
    type,
    value,
    max_uses,
    valid_from,
    valid_until,
    applies_to,
    plan_ids,
    course_ids,
    is_active,
  } = body as {
    code: string
    description?: string
    type: 'percentage' | 'fixed'
    value: number
    max_uses?: number | null
    valid_from?: string | null
    valid_until?: string | null
    applies_to?: 'all' | 'plans' | 'courses'
    plan_ids?: string[]
    course_ids?: string[]
    is_active?: boolean
  }

  if (!code || !type || value == null) {
    return NextResponse.json({ error: 'Campos obrigatórios: code, type, value' }, { status: 400 })
  }

  const { data, error } = await (
    supabase as unknown as {
      from: (t: string) => {
        insert: (row: Record<string, unknown>) => {
          select: () => {
            single: () => Promise<{
              data: unknown | null
              error: { message: string } | null
            }>
          }
        }
      }
    }
  )
    .from('coupons')
    .insert({
      code: code.toUpperCase().trim(),
      description: description ?? '',
      type,
      value,
      max_uses: max_uses || null,
      valid_from: valid_from || null,
      valid_until: valid_until || null,
      applies_to: applies_to ?? 'all',
      plan_ids: plan_ids ?? [],
      course_ids: course_ids ?? [],
      is_active: is_active ?? true,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ coupon: data }, { status: 201 })
}
