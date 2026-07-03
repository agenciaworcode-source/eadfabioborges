import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

// PATCH /api/admin/coupons/[id] — atualizar cupom
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, response } = await requireAdmin()
  if (response) return response

  const { id } = await params
  const body = (await request.json()) as Record<string, unknown>

  // Normalizar code se presente
  if (typeof body.code === 'string') {
    body.code = (body.code as string).toUpperCase().trim()
  }

  const { data, error } = await (
    supabase as unknown as {
      from: (t: string) => {
        update: (row: Record<string, unknown>) => {
          eq: (
            col: string,
            val: string
          ) => {
            select: () => {
              single: () => Promise<{
                data: unknown | null
                error: { message: string } | null
              }>
            }
          }
        }
      }
    }
  )
    .from('coupons')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ coupon: data })
}

// DELETE /api/admin/coupons/[id] — excluir cupom
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, response } = await requireAdmin()
  if (response) return response

  const { id } = await params

  const { error } = await (
    supabase as unknown as {
      from: (t: string) => {
        delete: () => {
          eq: (
            col: string,
            val: string
          ) => Promise<{
            error: { message: string } | null
          }>
        }
      }
    }
  )
    .from('coupons')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
