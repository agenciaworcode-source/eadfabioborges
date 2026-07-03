import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminCuponsClient } from '@/components/admin/AdminCuponsClient'

export default async function AdminCuponsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch coupons via service client to bypass RLS
  const { createServiceClient } = await import('@/lib/supabase/service')
  const sb = createServiceClient()

  const { data: coupons } = await (
    sb as unknown as {
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

  return <AdminCuponsClient initialCoupons={(coupons ?? []) as Record<string, unknown>[]} />
}
