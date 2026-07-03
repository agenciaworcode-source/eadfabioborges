import { createClient } from '@/lib/supabase/server'
import { AdminPlanosClient } from '@/components/admin/AdminPlanosClient'

interface PlanRow {
  id: string
  name: string
  description: string
  features: string[]
  badge: string
  audience: string
  hierarchy_level: number
  is_featured: boolean
  includes_all_courses: boolean
  billing_options: string[]
  price_monthly: number
  price_annual: number
  sort_order: number
  is_active: boolean
  updated_at: string
}

interface CourseRow {
  id: string
  title: string
  slug: string
  published: boolean
}

export default async function AdminPlanosPage() {
  const supabase = createClient()

  const [{ data: plansData }, { data: coursesData }] = await Promise.all([
    supabase
      .from('plans')
      .select(
        'id, name, description, features, badge, audience, hierarchy_level, is_featured, includes_all_courses, billing_options, price_monthly, price_annual, sort_order, is_active, updated_at'
      )
      .order('sort_order'),
    supabase.from('courses').select('id, title, slug, published').order('title'),
  ])

  const plans = (plansData ?? []) as unknown as PlanRow[]
  const allCourses = (coursesData ?? []) as unknown as CourseRow[]

  return <AdminPlanosClient plans={plans} allCourses={allCourses} />
}
