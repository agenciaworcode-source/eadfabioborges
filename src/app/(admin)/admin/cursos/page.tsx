import { createClient } from '@/lib/supabase/server'
import { AdminCursosEditor, type CourseRow } from '@/components/admin/AdminCursosEditor'

interface LessonRaw {
  id: string
  title: string
  type: 'video' | 'text' | 'pdf' | 'embed'
  vimeo_id: string | null
  youtube_url: string | null
  video_thumbnail_url: string | null
  completion_percent: number
  content_body: string | null
  embed_url: string | null
  pdf_url: string | null
  duration_secs: number
  order: number
  is_free_preview: boolean
}

interface ModuleRaw {
  id: string
  title: string
  order: number
  is_free_preview: boolean
  lessons: LessonRaw[]
}

interface CourseRaw {
  id: string
  slug: string
  title: string
  description: string | null
  price: number | null
  published: boolean | null
  is_vip: boolean | null
  thumbnail_url?: string | null
  level: string | null
  category: string | null
  access_type: string | null
  certificate_enabled: boolean | null
  access_days: number | null
  modules: ModuleRaw[]
}

interface AdminCursosPageProps {
  searchParams?: {
    courseId?: string
  }
}

export default async function AdminCursosPage({ searchParams }: AdminCursosPageProps) {
  const supabase = createClient()

  const { data: coursesData, error: coursesError } = await supabase
    .from('courses')
    .select(
      `
      id, slug, title, description, price, published, is_vip, thumbnail_url, level, category, access_type, certificate_enabled, access_days,
      modules(id, title, order, is_free_preview,
        lessons(id, title, type, vimeo_id, youtube_url, video_thumbnail_url, completion_percent, embed_url, pdf_url, duration_secs, order, is_free_preview)
      )
    `
    )
    .order('title')

  if (coursesError) {
    return (
      <div className="content wide">
        <div className="card card-pad">
          <h1 style={{ fontSize: '22px', marginBottom: '10px' }}>Erro ao carregar cursos</h1>
          <p className="muted" style={{ marginBottom: '10px' }}>
            O banco recusou a query da tela de cursos.
          </p>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '13px' }}>{coursesError.message}</pre>
        </div>
      </div>
    )
  }

  // Buscar contagem de alunos matriculados por curso
  const { data: enrollCounts } = await supabase
    .from('enrollments')
    .select('course_id')
    .in('status', ['active', 'completed'])

  const enrollMap: Record<string, number> = {}
  for (const e of enrollCounts ?? []) {
    const row = e as { course_id: string }
    enrollMap[row.course_id] = (enrollMap[row.course_id] ?? 0) + 1
  }

  const raw = (coursesData ?? []) as unknown as CourseRaw[]

  const courses: CourseRow[] = raw.map((c) => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
    description: c.description,
    price: c.price,
    published: c.published,
    is_vip: c.is_vip ?? false,
    thumbnail_url: c.thumbnail_url,
    level: c.level ?? 'todos',
    category: c.category ?? '',
    access_type: (c.access_type as 'free' | 'paid' | 'plan' | 'manual') ?? 'paid',
    certificate_enabled: c.certificate_enabled ?? true,
    access_days: c.access_days ?? null,
    moduleCount: c.modules?.length ?? 0,
    lessonCount: c.modules?.reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0) ?? 0,
    enrollmentCount: enrollMap[c.id] ?? 0,
    totalDurationSecs:
      c.modules?.reduce(
        (sum, m) => sum + m.lessons?.reduce((s, l) => s + (l.duration_secs ?? 0), 0),
        0
      ) ?? 0,
    modules: (c.modules ?? []).map((m) => ({
      id: m.id,
      course_id: c.id,
      title: m.title ?? 'Módulo',
      order: m.order ?? 0,
      is_free_preview: m.is_free_preview ?? false,
      lessons: (m.lessons ?? []).map((l) => ({
        id: l.id,
        module_id: m.id,
        title: l.title,
        type: l.type ?? 'video',
        vimeo_id: l.vimeo_id,
        youtube_url: l.youtube_url ?? null,
        video_thumbnail_url: l.video_thumbnail_url ?? null,
        completion_percent: l.completion_percent ?? 0,
        content_body: null,
        embed_url: l.embed_url,
        pdf_url: l.pdf_url,
        duration_secs: l.duration_secs ?? 0,
        order: l.order ?? 0,
        is_free_preview: l.is_free_preview ?? false,
      })),
    })),
  }))

  return <AdminCursosEditor courses={courses} initialCourseId={searchParams?.courseId} />
}
