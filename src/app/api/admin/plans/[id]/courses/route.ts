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

// GET /api/admin/plans/[id]/courses — listar cursos do plano
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const admin = await requireAdmin(supabase)
  if (!admin) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const sb = supabase as unknown as {
    from: (t: string) => {
      select: (cols: string) => {
        eq: (
          c: string,
          v: string
        ) => Promise<{ data: unknown[]; error: { message: string } | null }>
      }
    }
  }

  const { data, error } = await sb
    .from('plan_courses')
    .select('course_id, courses(id, title, slug, published)')
    .eq('plan_id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ courses: data })
}

// POST /api/admin/plans/[id]/courses — adicionar curso ao plano
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const admin = await requireAdmin(supabase)
  if (!admin) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const { courseId } = (await request.json()) as { courseId: string }
  if (!courseId) {
    return NextResponse.json({ error: 'courseId obrigatório' }, { status: 400 })
  }

  const sb = supabase as unknown as {
    from: (t: string) => {
      upsert: (
        row: Record<string, unknown>,
        opts: Record<string, unknown>
      ) => Promise<{ error: { message: string } | null }>
    }
  }

  const { error } = await sb
    .from('plan_courses')
    .upsert({ plan_id: params.id, course_id: courseId }, { onConflict: 'plan_id,course_id' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

// DELETE /api/admin/plans/[id]/courses — remover curso do plano
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const admin = await requireAdmin(supabase)
  if (!admin) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const { courseId } = (await request.json()) as { courseId: string }
  if (!courseId) {
    return NextResponse.json({ error: 'courseId obrigatório' }, { status: 400 })
  }

  const sb = supabase as unknown as {
    from: (t: string) => {
      delete: () => {
        eq: (
          c: string,
          v: string
        ) => {
          eq: (c2: string, v2: string) => Promise<{ error: { message: string } | null }>
        }
      }
    }
  }

  const { error } = await sb
    .from('plan_courses')
    .delete()
    .eq('plan_id', params.id)
    .eq('course_id', courseId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
