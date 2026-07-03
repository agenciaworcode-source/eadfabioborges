'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Check, Circle, Loader2 } from 'lucide-react'
import type { AdminUserProgressCourse } from '@/lib/admin/student-progress'

interface StudentProgressSectionProps {
  userId: string
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso))
}

function formatDateTime(iso: string | null) {
  if (!iso) return 'Nunca acessou'
  return `Última atividade: ${formatDate(iso)}`
}

export function StudentProgressSection({ userId }: StudentProgressSectionProps) {
  const [data, setData] = useState<AdminUserProgressCourse[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/admin/users/${userId}/progress`)
        const payload = (await response.json()) as AdminUserProgressCourse[] & { error?: string }

        if (!response.ok) {
          throw new Error(payload.error ?? 'Erro ao carregar progresso')
        }

        if (mounted) setData(payload)
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar progresso')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void load()

    return () => {
      mounted = false
    }
  }, [userId])

  const summary = useMemo(() => {
    const courses = data ?? []
    const average = courses.length
      ? Math.round(
          courses.reduce((sum, course) => sum + course.progress_percent, 0) / courses.length
        )
      : 0

    return {
      courses: courses.length,
      average,
      lessons: courses.reduce((sum, course) => sum + course.total_lessons, 0),
    }
  }, [data])

  if (loading) {
    return (
      <section className="student-progress">
        <div className="student-progress-head">
          <div>
            <h2>Progresso por Curso</h2>
            <p className="muted">Carregando dados do aluno...</p>
          </div>
          <Loader2 className="spin" size={18} />
        </div>
        <div className="progress-skeletons">
          {[0, 1, 2].map((index) => (
            <div key={index} className="progress-skeleton">
              <div className="s-line w-40" />
              <div className="s-line w-60" />
              <div className="s-line w-100" />
            </div>
          ))}
        </div>
        <style>{`
          .student-progress{ margin-top:24px; }
          .student-progress-head{ display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:14px; }
          .student-progress h2{ font-size:18px; margin:0; }
          .progress-skeletons{ display:grid; gap:12px; }
          .progress-skeleton{ border:1px solid var(--line); border-radius:var(--r); padding:14px; display:grid; gap:10px; }
          .s-line{ height:10px; border-radius:999px; background:linear-gradient(90deg,#eef0f3,#f7f8fa,#eef0f3); background-size:200% 100%; animation: pulse 1.2s ease-in-out infinite; }
          .w-40{ width:40%; }
          .w-60{ width:60%; }
          .w-100{ width:100%; height:6px; }
          .spin{ animation: spin 0.9s linear infinite; color: var(--muted); }
          @keyframes pulse{ 0%{ background-position:0% 50%; } 100%{ background-position:200% 50%; } }
          @keyframes spin{ from{ transform: rotate(0deg); } to{ transform: rotate(360deg); } }
        `}</style>
      </section>
    )
  }

  if (error) {
    return (
      <section className="student-progress">
        <div className="student-progress-head">
          <div>
            <h2>Progresso por Curso</h2>
            <p className="muted">Não foi possível carregar o drill-down.</p>
          </div>
        </div>
        <div className="progress-empty error">{error}</div>
        <style>{`
          .student-progress{ margin-top:24px; }
          .student-progress-head{ display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:14px; }
          .student-progress h2{ font-size:18px; margin:0; }
          .progress-empty{ border:1px solid var(--line); border-radius:var(--r); padding:16px; font-size:14px; color:var(--muted); background:#fff; }
          .progress-empty.error{ color:#b42318; background:#fff8f6; border-color:#f5c7bb; }
        `}</style>
      </section>
    )
  }

  if (!data || data.length === 0) {
    return (
      <section className="student-progress">
        <div className="student-progress-head">
          <div>
            <h2>Progresso por Curso</h2>
            <p className="muted">Visão consolidada do consumo do aluno.</p>
          </div>
        </div>
        <div className="progress-empty">Aluno não possui matrículas ativas</div>
        <style>{`
          .student-progress{ margin-top:24px; }
          .student-progress-head{ display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:14px; }
          .student-progress h2{ font-size:18px; margin:0; }
          .progress-empty{ border:1px solid var(--line); border-radius:var(--r); padding:16px; font-size:14px; color:var(--muted); background:#fff; }
        `}</style>
      </section>
    )
  }

  return (
    <section className="student-progress">
      <div className="student-progress-head">
        <div>
          <h2>Progresso por Curso</h2>
          <p className="muted">
            {summary.courses} curso{summary.courses !== 1 ? 's' : ''} · {summary.lessons} aulas ·
            média {summary.average}%
          </p>
        </div>
      </div>

      <div className="course-list">
        {data.map((course) => (
          <details key={course.course_id} className="course-item">
            <summary className="course-summary">
              <div className="course-summary-main">
                <div className="course-title-row">
                  <h3>{course.course_title}</h3>
                  <span className="course-percent">{course.progress_percent}%</span>
                </div>
                <div className="course-meta">
                  <span>{formatDateTime(course.last_activity_at)}</span>
                  <span>Matriculado em {formatDate(course.enrolled_at)}</span>
                  <span>
                    {course.expires_at
                      ? `Expira em ${formatDate(course.expires_at)}`
                      : 'Acesso vitalício'}
                  </span>
                </div>
                <div className="progress-track" aria-hidden="true">
                  <span style={{ width: `${course.progress_percent}%` }} />
                </div>
              </div>
              <ChevronDown size={18} className="chevron" />
            </summary>

            <div className="course-body">
              {course.modules.map((module) => (
                <details key={module.module_id} className="module-item">
                  <summary className="module-summary">
                    <div>
                      <strong>{module.module_title}</strong>
                      <div className="muted small">
                        {module.completed_lessons} de {module.total_lessons} aulas concluídas
                      </div>
                    </div>
                    <div className="module-right">
                      <span className="module-percent">{module.progress_percent}%</span>
                      <ChevronDown size={16} />
                    </div>
                  </summary>
                  <div className="lesson-list">
                    {module.lessons.map((lesson) => (
                      <div key={lesson.lesson_id} className="lesson-row">
                        {lesson.is_completed ? (
                          <Check size={14} className="lesson-ok" />
                        ) : (
                          <Circle size={14} className="lesson-pending" />
                        )}
                        <span>{lesson.lesson_title}</span>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </details>
        ))}
      </div>

      <style>{`
        .student-progress{ margin-top:24px; }
        .student-progress-head{ display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:14px; }
        .student-progress h2{ font-size:18px; margin:0; }
        .course-list{ display:grid; gap:12px; }
        .course-item{ border:1px solid var(--line); border-radius:var(--r); background:#fff; overflow:hidden; }
        .course-summary{ list-style:none; cursor:pointer; padding:16px; display:flex; align-items:flex-start; gap:12px; justify-content:space-between; }
        .course-summary::-webkit-details-marker{ display:none; }
        .course-summary-main{ flex:1; min-width:0; }
        .course-title-row{ display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
        .course-title-row h3{ margin:0; font-size:15px; line-height:1.2; }
        .course-percent{ font-weight:700; color:var(--blue); flex:none; }
        .course-meta{ display:flex; gap:10px; flex-wrap:wrap; font-size:12px; color:var(--muted); margin-top:6px; }
        .progress-track{ margin-top:10px; height:6px; background:#eef0f3; border-radius:999px; overflow:hidden; }
        .progress-track span{ display:block; height:100%; background:linear-gradient(90deg,var(--blue),var(--indigo)); }
        .chevron{ color:var(--muted); transition:transform .16s ease; flex:none; margin-top:2px; }
        details[open] > .course-summary .chevron,
        details[open] > .module-summary .chevron{ transform:rotate(180deg); }
        .course-body{ border-top:1px solid var(--line); padding:12px 16px 16px; display:grid; gap:10px; background:var(--surface-1); }
        .module-item{ border:1px solid var(--line-2); border-radius:10px; background:#fff; overflow:hidden; }
        .module-summary{ list-style:none; cursor:pointer; padding:12px 14px; display:flex; align-items:center; justify-content:space-between; gap:12px; }
        .module-summary::-webkit-details-marker{ display:none; }
        .module-right{ display:flex; align-items:center; gap:8px; color:var(--muted); flex:none; }
        .module-percent{ color:var(--ink); font-weight:700; font-size:12.5px; }
        .lesson-list{ border-top:1px solid var(--line-2); padding:10px 14px 12px; display:grid; gap:8px; }
        .lesson-row{ display:flex; align-items:center; gap:8px; font-size:13px; color:var(--ink-2); }
        .lesson-ok{ color:#15803d; flex:none; }
        .lesson-pending{ color:#9ca3af; flex:none; }
        .small{ font-size:12px; }
      `}</style>
    </section>
  )
}
