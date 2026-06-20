import { createClient } from '@/lib/supabase/server'
import { AdminAlunosClient, type AlunoRow } from '@/components/admin/AdminAlunosClient'

interface UserRaw {
  id: string
  name: string
  email: string
  plan: string | null
  created_at: string
}

interface CourseRaw {
  id: string
  title: string
}

export default async function AdminAlunosPage() {
  const supabase = createClient()

  // Preços dos planos (fonte única: tabela plans)
  const { data: plansData } = await supabase
    .from('plans')
    .select('id, price_monthly')
  const planPrices = Object.fromEntries(
    ((plansData ?? []) as Array<{ id: string; price_monthly: number }>).map((p) => [
      p.id,
      p.price_monthly / 100,
    ])
  )

  const { data: usersData } = await supabase
    .from('users')
    .select('id, name, email, plan, created_at')
    .neq('role', 'admin')
    .order('created_at', { ascending: false })
    .limit(200)

  const users = (usersData ?? []) as unknown as UserRaw[]

  // Fetch enrollment counts per user
  const { data: enrollData } = await supabase
    .from('enrollments')
    .select('user_id')
    .in(
      'user_id',
      users.map((u) => u.id)
    )

  const enrollMap: Record<string, number> = {}
  for (const e of enrollData ?? []) {
    const row = e as { user_id: string }
    enrollMap[row.user_id] = (enrollMap[row.user_id] ?? 0) + 1
  }

  // Fetch certificate counts per user
  const { data: certData } = await supabase
    .from('certificates')
    .select('user_id')
    .in(
      'user_id',
      users.map((u) => u.id)
    )

  const certMap: Record<string, number> = {}
  for (const c of certData ?? []) {
    const row = c as { user_id: string }
    certMap[row.user_id] = (certMap[row.user_id] ?? 0) + 1
  }

  // Fetch subscription revenue per user
  const { data: subsData } = await supabase
    .from('subscriptions')
    .select('user_id, plan')
    .in(
      'user_id',
      users.map((u) => u.id)
    )

  const revenueMap: Record<string, number> = {}
  for (const s of subsData ?? []) {
    const row = s as { user_id: string; plan: string }
    const price = planPrices[(row.plan ?? '').toLowerCase()] ?? 0
    revenueMap[row.user_id] = (revenueMap[row.user_id] ?? 0) + price
  }

  // Fetch courses for manual enrollment form
  const { data: coursesData } = await supabase
    .from('courses')
    .select('id, title')
    .eq('published', true)
    .order('title')

  const courseOptions = (coursesData ?? []) as unknown as CourseRaw[]

  const rows: AlunoRow[] = users.map((u) => ({
    id: u.id,
    name: u.name ?? u.email?.split('@')[0] ?? 'Aluno',
    email: u.email ?? '',
    plan: u.plan,
    created_at: u.created_at,
    enrollmentCount: enrollMap[u.id] ?? 0,
    certificateCount: certMap[u.id] ?? 0,
    revenue: revenueMap[u.id] ?? 0,
  }))

  return (
    <AdminAlunosClient
      users={rows}
      courseOptions={courseOptions.map((c) => ({ id: c.id, title: c.title }))}
    />
  )
}
