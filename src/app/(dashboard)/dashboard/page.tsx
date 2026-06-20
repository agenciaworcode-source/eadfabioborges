import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type EnrollmentRow = Database['public']['Tables']['enrollments']['Row']
type CourseRow = Database['public']['Tables']['courses']['Row']

interface EnrollmentWithCourse extends EnrollmentRow {
  courses: CourseRow | null
}

function getThumbClass(index: number): string {
  const classes = ['', 'b2', 'b3', 'b4']
  return classes[index % classes.length]
}

export default async function DashboardPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Perfil do usuário
  const { data: profileData } = await supabase
    .from('users')
    .select('name')
    .eq('id', user.id)
    .single()

  const profile = profileData as { name: string } | null
  const displayName =
    profile?.name ||
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split('@')[0] ||
    'Aluna'
  const firstName = displayName.split(' ')[0]

  // Matrículas com cursos
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('*, courses(*)')
    .eq('user_id', user.id)
    .in('status', ['active', 'completed'])

  const typedEnrollments = (enrollments ?? []) as unknown as EnrollmentWithCourse[]
  const activeCount = typedEnrollments.filter((e) => e.status === 'active').length

  // Certificados
  const { count: certCount } = await supabase
    .from('certificates')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Progresso por curso
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
    })
  )

  const validEnrollments = enrollmentsWithProgress.filter(
    (e): e is NonNullable<typeof e> => e !== null
  )

  const totalCompleted = validEnrollments.reduce((acc, e) => acc + e.completedLessons, 0)
  const totalLessons = validEnrollments.reduce((acc, e) => acc + e.totalLessons, 0)

  // Curso para "continue de onde parou": primeiro com progresso entre 0% e 100%
  const resumeCourse =
    validEnrollments.find((e) => {
      const pct = e.totalLessons > 0 ? e.completedLessons / e.totalLessons : 0
      return pct > 0 && pct < 1
    }) ?? validEnrollments[0]

  const resumePct =
    resumeCourse && resumeCourse.totalLessons > 0
      ? Math.round((resumeCourse.completedLessons / resumeCourse.totalLessons) * 100)
      : 0

  return (
    <>
      <style>{`
        .hello h1{ font-size:30px; }
        .summary{ display:grid; grid-template-columns:repeat(3,1fr); gap:18px; margin-top:24px; }
        .resume{ background:linear-gradient(120deg,var(--ink),#23262e); color:#fff; border-radius:var(--r-lg); padding:28px; display:grid; grid-template-columns:1fr auto; gap:24px; align-items:center; overflow:hidden; position:relative; }
        .resume .glow{ position:absolute; width:300px; height:300px; right:-60px; top:-80px; border-radius:50%; background:radial-gradient(circle,rgba(72,161,254,.4),transparent 70%); }
        .resume .z{ position:relative; }
        .mygrid{ display:grid; grid-template-columns:repeat(3,1fr); gap:20px; margin-top:18px; }
        .mc{ background:#fff; border:1px solid var(--line); border-radius:var(--r-lg); overflow:hidden; box-shadow:var(--shadow-xs); transition:transform .15s; display:block; }
        .mc:hover{ transform:translateY(-3px); }
        .mc .thumb{ border-radius:0; aspect-ratio:16/9; }
        .mc .body{ padding:16px; }
        .mc h3{ font-size:15.5px; line-height:1.25; }
        .mc .pmeta{ display:flex; justify-content:space-between; font-size:12px; color:var(--muted); margin:12px 0 7px; }
        @media (max-width:900px){ .summary,.mygrid{ grid-template-columns:1fr; } }
      `}</style>

      <div className="content wide">
        {/* SAUDAÇÃO */}
        <div className="hello">
          <h1>Olá, {firstName} 👋</h1>
          <p className="muted" style={{ marginTop: '6px' }}>
            {resumeCourse && resumeCourse.totalLessons > resumeCourse.completedLessons
              ? `Você está a ${resumeCourse.totalLessons - resumeCourse.completedLessons} aulas de concluir mais um curso. Continue assim!`
              : 'Bem-vinda à sua área de aprendizado!'}
          </p>
        </div>

        {/* SUMMARY */}
        <div className="summary">
          <div className="stat">
            <div className="lbl">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="1.8">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
              Cursos ativos
            </div>
            <div className="num">{activeCount}</div>
            <div className="delta">
              {typedEnrollments.length > 0
                ? `de ${typedEnrollments.length} matrículas`
                : 'Nenhuma matrícula'}
            </div>
          </div>
          <div className="stat">
            <div className="lbl">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="1.8">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
              Aulas concluídas
            </div>
            <div className="num">{totalCompleted}</div>
            <div className="delta">de {totalLessons} no total</div>
          </div>
          <div className="stat">
            <div className="lbl">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="1.8">
                <circle cx="12" cy="8" r="6" />
                <path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5" />
              </svg>
              Certificados
            </div>
            <div className="num">{certCount ?? 0}</div>
            <div className="delta">de {typedEnrollments.length} trilhas</div>
          </div>
        </div>

        {/* CONTINUE DE ONDE PAROU */}
        {resumeCourse && (
          <>
            <h3 style={{ margin: '34px 0 14px', fontSize: '18px' }}>Continue de onde parou</h3>
            <div className="resume">
              <div className="glow" />
              <div className="z">
                <span
                  className="badge blue"
                  style={{ background: 'rgba(72,161,254,.2)', color: '#9ecbff' }}
                >
                  {resumeCourse.completedLessons} / {resumeCourse.totalLessons} aulas
                </span>
                <h2 style={{ color: '#fff', fontSize: '26px', margin: '12px 0 6px' }}>
                  {resumeCourse.course.title}
                </h2>
                <p style={{ color: 'rgba(255,255,255,.65)', fontSize: '14.5px' }}>
                  {resumeCourse.totalLessons - resumeCourse.completedLessons} aulas restantes para concluir o curso
                </p>
                <div
                  className="progress"
                  style={{ margin: '18px 0 8px', maxWidth: '360px', background: 'rgba(255,255,255,.15)' }}
                >
                  <span style={{ width: `${resumePct}%` }} />
                </div>
                <span style={{ color: 'rgba(255,255,255,.6)', fontSize: '13px' }}>{resumePct}% concluído</span>
              </div>
              <Link className="btn btn-primary btn-lg z" href={`/dashboard/curso/${resumeCourse.course.id}`}>
                ▶ Continuar
              </Link>
            </div>
          </>
        )}

        {/* CURSOS MATRICULADOS */}
        {validEnrollments.length > 0 ? (
          <>
            <div className="flex between aic" style={{ margin: '34px 0 4px' }}>
              <h3 style={{ fontSize: '18px' }}>Meus cursos matriculados</h3>
            </div>
            <div className="mygrid">
              {validEnrollments.map((item, idx) => {
                const pct =
                  item.totalLessons > 0
                    ? Math.round((item.completedLessons / item.totalLessons) * 100)
                    : 0
                const isComplete = pct === 100
                return (
                  <Link
                    key={item.enrollment.id}
                    className="mc"
                    href={`/dashboard/curso/${item.course.id}`}
                  >
                    <div className={`thumb ${getThumbClass(idx)}`}>
                      {(item.course as CourseRow & { thumbnail_url?: string | null }).thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={(item.course as CourseRow & { thumbnail_url?: string | null }).thumbnail_url!}
                          alt={item.course.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
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
                      )}
                    </div>
                    <div className="body">
                      <h3>{item.course.title}</h3>
                      <div className="pmeta">
                        <span>{pct}% concluído</span>
                        {isComplete ? (
                          <span className="badge green" style={{ padding: '1px 8px' }}>
                            Concluído
                          </span>
                        ) : (
                          <span>
                            {item.completedLessons} / {item.totalLessons} aulas
                          </span>
                        )}
                      </div>
                      <div className="progress">
                        <span style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        ) : (
          <div className="card card-pad center" style={{ marginTop: '34px' }}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--faint)"
              strokeWidth="1.5"
              style={{ margin: '0 auto 16px' }}
            >
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            <h3 style={{ fontSize: '18px' }}>Você ainda não está matriculada em nenhum curso</h3>
            <p className="muted" style={{ margin: '8px 0 20px', fontSize: '14.5px' }}>
              Explore o catálogo e comece sua jornada de aprendizado.
            </p>
            <Link className="btn btn-primary" href="/cursos">
              Ver cursos disponíveis
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
