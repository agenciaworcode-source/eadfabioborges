import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, name')
    .eq('id', user.id)
    .maybeSingle()

  const name =
    (profile as { full_name?: string; name?: string } | null)?.full_name ??
    (profile as { full_name?: string; name?: string } | null)?.name ??
    undefined

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name,
  })
}
