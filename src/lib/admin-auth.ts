import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function requireAdmin() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      supabase,
      user: null,
      response: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }),
    }
  }

  const { data: profileData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if ((profileData as { role: string } | null)?.role !== 'admin') {
    return {
      supabase,
      user,
      response: NextResponse.json({ error: 'Acesso negado' }, { status: 403 }),
    }
  }

  return { supabase, user, response: null }
}
