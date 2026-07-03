import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface EnrollmentRaw {
  id: string
  user_id: string
  course_id: string
  status: string
  enrolled_at: string
  users: { name: string | null; email: string | null } | null
  courses: { title: string | null } | null
}

interface LessonProgressRaw {
  lesson_id: string
  user_id: string
}

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

  const url = new URL(request.url)
  const courseId = url.searchParams.get('courseId') ?? undefined
  const status = url.searchParams.get('status') ?? undefined
  const period = url.searchParams.get('period') ?? undefined
  const search = url.searchParams.get('search') ?? undefined
  const page = parseInt(url.searchParams.get('page') ?? '0', 10)
  const pageSize = 20

  // Busca por nome/email: primeiro resolve user_ids correspondentes
  let searchUserIds: string[] | null = null
  if (search && search.trim().length >= 1) {
    const { data: usersFound } = await supabase
      .from('users')
      .select('id')
      .or(`name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`)
      .limit(200)
    searchUserIds = (usersFound ?? []).map((u: { id: string }) => u.id)
    if (searchUserIds.length === 0) {
      return NextResponse.json({ enrollments: [], total: 0, page, pageSize })
    }
  }

  let query = supabase
    .from('enrollments')
    .select('id, user_id, course_id, status, enrolled_at, users(name, email), courses(title)', {
      count: 'exact',
    })
    .order('enrolled_at', { ascending: false })

  if (courseId) {
    query = query.eq('course_id', courseId)
  }

  if (status && status !== 'all') {
    query = query.eq('status', status as never)
  }

  if (period) {
    const now = new Date()
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : null
    if (days) {
      const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      query = query.gte('enrolled_at', since.toISOString())
    }
  }

  if (searchUserIds !== null) {
    query = query.in('user_id', searchUserIds)
  }

  query = query.range(page * pageSize, (page + 1) * pageSize - 1)

  const { data, count, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const enrollments = (data ?? []) as unknown as EnrollmentRaw[]
  const filtered = enrollments

  // Buscar total de aulas por curso (para calcular progresso)
  const courseIds = Array.from(new Set(filtered.map((e) => e.course_id)))
  const lessonsByCourse: Record<string, string[]> = {}

  for (const cId of courseIds) {
    const { data: lessonsData } = await supabase
      .from('lessons')
      .select('id, modules!inner(course_id)')
      .eq('modules.course_id' as never, cId)
    lessonsByCourse[cId] = ((lessonsData ?? []) as unknown as Array<{ id: string }>).map(
      (l) => l.id
    )
  }

  // Buscar progresso de todos os usuários de uma vez por curso
  const userIds = Array.from(new Set(filtered.map((e) => e.user_id)))
  let allProgress: LessonProgressRaw[] = []

  if (userIds.length > 0) {
    const allLessonIds = Object.values(lessonsByCourse).flat()
    if (allLessonIds.length > 0) {
      const { data: progData } = await supabase
        .from('lesson_progress')
        .select('lesson_id, user_id')
        .in('user_id', userIds)
        .in('lesson_id', allLessonIds)
        .eq('completed', true)
      allProgress = (progData ?? []) as unknown as LessonProgressRaw[]
    }
  }

  // Calcular progresso por (user_id, course_id)
  const progressKey = (userId: string, courseId: string) => `${userId}::${courseId}`
  const completionMap: Record<string, number> = {}
  for (const p of allProgress) {
    for (const [cId, lIds] of Object.entries(lessonsByCourse)) {
      if (lIds.includes(p.lesson_id)) {
        const key = progressKey(p.user_id, cId)
        completionMap[key] = (completionMap[key] ?? 0) + 1
      }
    }
  }

  const result = filtered.map((e) => {
    const totalLessons = lessonsByCourse[e.course_id]?.length ?? 0
    const completedLessons = completionMap[progressKey(e.user_id, e.course_id)] ?? 0
    const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

    return {
      id: e.id,
      userId: e.user_id,
      userName: e.users?.name ?? e.users?.email?.split('@')[0] ?? 'Aluno',
      userEmail: e.users?.email ?? '',
      courseId: e.course_id,
      courseTitle: e.courses?.title ?? 'Curso',
      status: e.status,
      enrolledAt: e.enrolled_at,
      progress,
    }
  })

  return NextResponse.json({
    enrollments: result,
    total: count ?? result.length,
    page,
    pageSize,
  })
}
