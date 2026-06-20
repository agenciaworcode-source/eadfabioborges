import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

export const metadata: Metadata = {
  title: 'Meus Cursos | Mentoria Fábio Borges',
  description: 'Acompanhe o progresso dos seus cursos matriculados.',
}

type EnrollmentRow = Database['public']['Tables']['enrollments']['Row']
type CourseRow = Database['public']['Tables']['courses']['Row']

interface EnrollmentWithCourse extends EnrollmentRow {
  courses: CourseRow | null
}

const THUMB_COLORS = ['', 'b2', 'b3', 'b4']

function CourseIcon() {
  return (
    <svg
      className="cat-icn"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  )
}

export default async function MeusCursosPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('*, courses(*)')
    .eq('user_id', user.id)
    .in('status', ['active', 'completed'])
    .order('enrolled_at', { ascending: false })

  const typedEnrollments = (enrollments ?? []) as unknown as EnrollmentWithCourse[]

  // Calcular progresso por curso
  const enrollmentsWithProgress = await Promise.all(
    typedEnrollments.map(async (enrollment) => {
      const course = enrollment.courses
      if (!course) return null

      const { data: modules } = await supabase
        .from('modules')
        .select('id')
        .eq('course_id', course.id)

      const moduleIds = ((modules ?? []) as Array<{ id: string }>).map((m) => m.id)

      if (moduleIds.length === 0) {
        return { enrollment, course, completedLessons: 0, totalLessons: 0 }
      }

      const { count: totalLessons } = await supabase
        .from('lessons')
        .select('id', { count: 'exact', head: true })
        .in('module_id', moduleIds)

      const { data: lessonRows } = await supabase
        .from('lessons')
        .select('id')
        .in('module_id', moduleIds)

      const lessonIds = ((lessonRows ?? []) as Array<{ id: string }>).map((l) => l.id)

      const { count: completedLessons } =
        lessonIds.length > 0
          ? await supabase
              .from('lesson_progress')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', user.id)
              .in('lesson_id', lessonIds)
              .eq('completed', true)
          : { count: 0 }

      return {
        enrollment,
        course,
        completedLessons: completedLessons ?? 0,
        totalLessons: totalLessons ?? 0,
      }
    }),
  )

  const valid = enrollmentsWithProgress.filter(
    (e): e is NonNullable<typeof e> => e !== null,
  )

  return (
    <>
      <style>{`
        .mc-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:20px; margin-top:22px; }
        .mc{ background:#fff; border:1px solid var(--line); border-radius:var(--r-lg); overflow:hidden; box-shadow:var(--shadow-xs); transition:transform .15s; display:block; text-decoration:none; color:inherit; }
        .mc:hover{ transform:translateY(-3px); box-shadow:var(--shadow); }
        .mc .thumb{ border-radius:0; aspect-ratio:16/9; }
        .mc .body{ padding:16px; }
        .mc h3{ font-size:15.5px; line-height:1.25; margin:0 0 12px; }
        .mc .pmeta{ display:flex; justify-content:space-between; align-items:center; font-size:12px; color:var(--muted); margin-bottom:8px; }
        .mc .prog-wrap{ height:5px; background:#eef0f3; border-radius:980px; overflow:hidden; }
        .mc .prog-wrap span{ display:block; height:100%; background:var(--blue); border-radius:980px; transition:width .3s; }
        .mc-empty{ text-align:center; padding:60px 20px; }
        @media (max-width:900px){ .mc-grid{ grid-template-columns:1fr 1fr; } }
        @media (max-width:600px){ .mc-grid{ grid-template-columns:1fr; } }
      `}</style>

      <div className="content wide">
        <div className="flex between aic">
          <div>
            <h1 style={{ fontSize: '28px' }}>Meus cursos</h1>
            <p className="muted" style={{ marginTop: '6px' }}>
              {valid.length > 0
                ? `${valid.length} curso${valid.length !== 1 ? 's' : ''} matriculado${valid.length !== 1 ? 's' : ''}`
                : 'Nenhum curso ainda'}
            </p>
          </div>
        </div>

        {valid.length === 0 ? (
          <div className="card card-pad mc-empty" style={{ marginTop: '32px' }}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--faint)"
              strokeWidth="1.2"
              style={{ display: 'block', margin: '0 auto 16px' }}
            >
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>
              Você ainda não está matriculado em nenhum curso
            </h3>
            <p className="muted" style={{ fontSize: '14.5px', marginBottom: '20px' }}>
              Explore o catálogo e comece sua jornada de aprendizado.
            </p>
            <Link href="/cursos" className="btn btn-primary btn-sm">
              Ver catálogo de cursos
            </Link>
          </div>
        ) : (
          <div className="mc-grid">
            {valid.map((item, idx) => {
              const pct =
                item.totalLessons > 0
                  ? Math.round((item.completedLessons / item.totalLessons) * 100)
                  : 0
              const isComplete = item.enrollment.status === 'completed' || pct === 100
              const thumbColor = THUMB_COLORS[idx % THUMB_COLORS.length]
              const thumbUrl = (item.course as CourseRow & { thumbnail_url?: string | null })
                .thumbnail_url

              return (
                <Link
                  key={item.enrollment.id}
                  className="mc"
                  href={`/dashboard/curso/${item.course.id}`}
                >
                  <div className={`thumb${thumbColor ? ' ' + thumbColor : ''}`}>
                    {thumbUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumbUrl}
                        alt={item.course.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <CourseIcon />
                    )}
                  </div>
                  <div className="body">
                    <h3>{item.course.title}</h3>
                    <div className="pmeta">
                      <span>{pct}% concluído</span>
                      {isComplete ? (
                        <span className="badge green" style={{ padding: '2px 8px', fontSize: '11px' }}>
                          Concluído
                        </span>
                      ) : (
                        <span>
                          {item.completedLessons}/{item.totalLessons} aulas
                        </span>
                      )}
                    </div>
                    <div className="prog-wrap">
                      <span style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
