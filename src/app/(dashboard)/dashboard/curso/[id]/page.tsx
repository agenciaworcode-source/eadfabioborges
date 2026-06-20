import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CoursePlayerLayout } from './CoursePlayerLayout'

interface PageProps {
  params: { id: string }
}

interface LessonRow {
  id: string
  title: string
  type: 'video' | 'text' | 'pdf' | 'embed'
  vimeo_id: string | null
  content_body: string | null
  embed_url: string | null
  pdf_url: string | null
  duration_secs: number
  order: number
}

interface ModuleRow {
  id: string
  title: string
  order: number
  lessons: LessonRow[]
}

interface CourseRow {
  id: string
  title: string
  slug: string
  description: string | null
  modules: ModuleRow[]
}

export default async function CursoPage({ params }: PageProps) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) notFound()

  const { data, error } = await supabase
    .from('courses')
    .select(
      `
      id,
      title,
      slug,
      description,
      modules (
        id,
        title,
        order,
        lessons (
          id,
          title,
          type,
          vimeo_id,
          content_body,
          embed_url,
          pdf_url,
          duration_secs,
          order
        )
      )
    `
    )
    .eq('id', params.id)
    .single()

  if (error || !data) notFound()

  const course = data as unknown as CourseRow

  // Verificar acesso server-side
  const [{ data: enrollments }, { data: subscriptions }] = await Promise.all([
    supabase
      .from('enrollments')
      .select('status')
      .eq('user_id', user.id)
      .eq('course_id', params.id)
      .in('status', ['active', 'completed']),
    supabase
      .from('subscriptions')
      .select('status, period_end')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('period_end', new Date().toISOString()),
  ])

  const hasAccess =
    (enrollments?.length ?? 0) > 0 || (subscriptions?.length ?? 0) > 0

  const sortedModules = [...(course.modules ?? [])].sort(
    (a, b) => a.order - b.order
  )

  return (
    <CoursePlayerLayout
      courseId={params.id}
      courseTitle={course.title}
      modules={sortedModules}
      hasAccess={hasAccess}
    />
  )
}
