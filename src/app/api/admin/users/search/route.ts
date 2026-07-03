import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: profileData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if ((profileData as { role: string } | null)?.role !== 'admin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() ?? ''

  if (q.length < 2) {
    return NextResponse.json({ users: [] })
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, name, email')
    .or(`name.ilike.%${q}%,email.ilike.%${q}%`)
    .order('name')
    .limit(10)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ users: data ?? [] })
}
