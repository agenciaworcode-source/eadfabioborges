import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(request: Request) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')

  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('enrollments')
    .update({ status: 'expired' } as never)
    .lt('expires_at', new Date().toISOString())
    .eq('status', 'active')
    .select('id')

  if (error) {
    console.error('[cron/expire-enrollments] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    updated: data?.length ?? 0,
    timestamp: new Date().toISOString(),
  })
}
