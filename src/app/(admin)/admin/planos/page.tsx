import { createClient } from '@/lib/supabase/server'
import { AdminPlanosClient } from '@/components/admin/AdminPlanosClient'

interface PlanRow {
  id: string
  name: string
  price_monthly: number
  price_annual: number
  sort_order: number
  is_active: boolean
  updated_at: string
}

export default async function AdminPlanosPage() {
  const supabase = createClient()
  const { data } = await supabase
    .from('plans')
    .select('id, name, price_monthly, price_annual, sort_order, is_active, updated_at')
    .order('sort_order')

  const plans = (data ?? []) as PlanRow[]

  return <AdminPlanosClient plans={plans} />
}
