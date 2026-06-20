import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface EnrollmentRow {
  id: string
  user_id: string
  status: string
  enrolled_at: string
  users: { name: string | null; email: string | null } | null
}

interface LessonRow {
  id: string
}

interface ProgressRow {
  lesson_id: string
  user_id: string
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: profileData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if ((profileData as { role: string } | null)?.role !== 'admin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const courseId = params.id

  // Buscar todos os enrollments do curso
  const { data: enrollmentsData, error: enrollError } = await supabase
    .from('enrollments')
    .select('id, user_id, status, enrolled_at, users(name, email)')
    .eq('course_id', courseId)
    .order('enrolled_at', { ascending: false })

  if (enrollError) {
    return NextResponse.json({ error: enrollError.message }, { status: 500 })
  }

  const enrollments = (enrollmentsData ?? []) as unknown as EnrollmentRow[]

  // Buscar total de aulas do curso
  const { data: lessonsData } = await supabase
    .from('lessons')
    .select('id, modules!inner(course_id)')
    .eq('modules.course_id' as never, courseId)

  const totalLessons = (lessonsData ?? []) as unknown as LessonRow[]
  const lessonIds = totalLessons.map((l) => l.id)

  // Buscar progresso de todos os alunos matriculados de uma vez
  const userIds = enrollments.map((e) => e.user_id)

  let progressData: ProgressRow[] = []
  if (userIds.length > 0 && lessonIds.length > 0) {
    const { data } = await supabase
      .from('lesson_progress')
      .select('lesson_id, user_id')
      .in('user_id', userIds)
      .in('lesson_id', lessonIds)
      .eq('completed', true)

    progressData = (data ?? []) as unknown as ProgressRow[]
  }

  // Agrupar progresso por user_id
  const progressMap: Record<string, number> = {}
  for (const p of progressData) {
    progressMap[p.user_id] = (progressMap[p.user_id] ?? 0) + 1
  }

  const result = enrollments.map((e) => {
    const completed = progressMap[e.user_id] ?? 0
    const progress =
      lessonIds.length > 0 ? Math.round((completed / lessonIds.length) * 100) : 0

    return {
      id: e.id,
      userId: e.user_id,
      name: e.users?.name ?? e.users?.email?.split('@')[0] ?? 'Aluno',
      email: e.users?.email ?? '',
      status: e.status,
      enrolledAt: e.enrolled_at,
      progress,
      completedLessons: completed,
      totalLessons: lessonIds.length,
    }
  })

  return NextResponse.json({ enrollments: result, total: result.length })
}
