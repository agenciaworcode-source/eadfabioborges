import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

interface EnrollmentRaw {
  id: string
  course_id: string
  status: string
  enrolled_at: string
  courses: { id: string; title: string; thumbnail_url: string | null } | null
}

interface LessonRaw {
  id: string
}

interface ProgressRaw {
  lesson_id: string
}

interface ModuleRaw {
  id: string
  title: string
  order: number
  lessons: LessonRaw[]
}

export async function GET(
  _req: Request,
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

  const targetId = params.id

  // Dados básicos do aluno
  const { data: userData } = await supabase
    .from('users')
    .select('id, name, email, plan, created_at')
    .eq('id', targetId)
    .single()

  if (!userData) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  }

  // Tentar buscar last_sign_in_at do auth via service role
  let lastSignIn: string | null = null
  try {
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: authUser } = await serviceClient.auth.admin.getUserById(targetId)
    lastSignIn = authUser?.user?.last_sign_in_at ?? null
  } catch {
    // fallback gracioso
  }

  // Enrollments com dados do curso
  const { data: enrollmentsData } = await supabase
    .from('enrollments')
    .select('id, course_id, status, enrolled_at, courses(id, title, thumbnail_url)')
    .eq('user_id', targetId)
    .order('enrolled_at', { ascending: false })

  const enrollments = (enrollmentsData ?? []) as unknown as EnrollmentRaw[]

  // Para cada enrollment, calcular progresso
  const courseIds = enrollments.map((e) => e.course_id)
  const enrichedEnrollments = []

  for (const enrollment of enrollments) {
    const courseId = enrollment.course_id

    // Total de aulas do curso
    const { data: lessonsData } = await supabase
      .from('lessons')
      .select('id, modules!inner(course_id)')
      .eq('modules.course_id' as never, courseId)

    const lessons = (lessonsData ?? []) as unknown as LessonRaw[]
    const lessonIds = lessons.map((l) => l.id)

    let completedCount = 0
    if (lessonIds.length > 0) {
      const { data: progressData } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('user_id', targetId)
        .in('lesson_id', lessonIds)
        .eq('completed', true)
      completedCount = (progressData ?? []).length
    }

    const progress = lessonIds.length > 0
      ? Math.round((completedCount / lessonIds.length) * 100)
      : 0

    enrichedEnrollments.push({
      id: enrollment.id,
      courseId: enrollment.course_id,
      courseTitle: enrollment.courses?.title ?? 'Curso',
      courseThumbnail: enrollment.courses?.thumbnail_url ?? null,
      status: enrollment.status,
      enrolledAt: enrollment.enrolled_at,
      progress,
      completedLessons: completedCount,
      totalLessons: lessonIds.length,
    })
  }

  // Progresso por módulo (para cada enrollment)
  const moduleProgress: Record<string, Array<{ title: string; completed: number; total: number; order: number }>> = {}

  for (const enrollment of enrichedEnrollments) {
    const { data: modulesData } = await supabase
      .from('modules')
      .select('id, title, order, lessons(id)')
      .eq('course_id', enrollment.courseId)
      .order('order')

    const modules = (modulesData ?? []) as unknown as ModuleRaw[]
    const moduleList = []

    for (const mod of modules) {
      const modLessonIds = mod.lessons?.map((l) => l.id) ?? []
      let modCompleted = 0
      if (modLessonIds.length > 0) {
        const { data: progData } = await supabase
          .from('lesson_progress')
          .select('lesson_id')
          .eq('user_id', targetId)
          .in('lesson_id', modLessonIds)
          .eq('completed', true)
        modCompleted = (progData ?? []).length
      }
      moduleList.push({ title: mod.title, completed: modCompleted, total: modLessonIds.length, order: mod.order })
    }

    moduleProgress[enrollment.id] = moduleList
  }

  // Certificados
  const { count: certCount } = await supabase
    .from('certificates')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', targetId)

  // Avg progress
  const avgProgress = enrichedEnrollments.length > 0
    ? Math.round(enrichedEnrollments.reduce((s, e) => s + e.progress, 0) / enrichedEnrollments.length)
    : 0

  const u = userData as { id: string; name: string; email: string; plan: string | null; created_at: string }

  return NextResponse.json({
    user: {
      id: u.id,
      name: u.name,
      email: u.email,
      plan: u.plan,
      createdAt: u.created_at,
      lastSignIn,
    },
    enrollments: enrichedEnrollments,
    moduleProgress,
    certificates: certCount ?? 0,
    avgProgress,
    courseIds,
  })
}
