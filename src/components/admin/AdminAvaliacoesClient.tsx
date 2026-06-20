'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { QuizBuilder } from './QuizBuilder'

export interface QuizSummary {
  id: string
  title: string
  passScore: number
  attemptsAllowed: number
  questionCount: number
}

export interface AvaliacoesCourse {
  id: string
  title: string
  slug: string
  published: boolean
  moduleCount: number
  lessonCount: number
  finalQuiz: QuizSummary | null
}

export interface LessonQuiz {
  id: string
  courseId: string
  courseTitle: string
  moduleTitle: string
  lessonId: string
  lessonTitle: string
  title: string
  passScore: number
  attemptsAllowed: number
  questionCount: number
}

interface AdminAvaliacoesClientProps {
  courses: AvaliacoesCourse[]
  lessonQuizzes: LessonQuiz[]
  initialCourseId?: string
}

type View = 'provas' | 'aulas'

export function AdminAvaliacoesClient({
  courses,
  lessonQuizzes,
  initialCourseId,
}: AdminAvaliacoesClientProps) {
  const initialCourse = courses.find((course) => course.id === initialCourseId)
  const [activeView, setActiveView] = useState<View>('provas')
  const [search, setSearch] = useState('')
  const [selectedCourse, setSelectedCourse] = useState<AvaliacoesCourse | null>(
    initialCourse ?? null
  )

  const filteredCourses = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return courses
    return courses.filter((course) => course.title.toLowerCase().includes(query))
  }, [courses, search])

  const filteredLessonQuizzes = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return lessonQuizzes
    return lessonQuizzes.filter((quiz) =>
      `${quiz.courseTitle} ${quiz.moduleTitle} ${quiz.lessonTitle} ${quiz.title}`
        .toLowerCase()
        .includes(query)
    )
  }, [lessonQuizzes, search])

  const coursesWithFinalQuiz = courses.filter((course) => course.finalQuiz).length
  const totalQuestions = courses.reduce(
    (sum, course) => sum + (course.finalQuiz?.questionCount ?? 0),
    0
  )

  return (
    <>
      <style>{`
        .eval-head{ display:flex; justify-content:space-between; align-items:flex-start; gap:18px; margin-bottom:22px; }
        .eval-head h1{ font-size:28px; margin:0; }
        .eval-grid{ display:grid; grid-template-columns:minmax(300px,420px) minmax(0,1fr); gap:22px; align-items:start; }
        .eval-tabs{ display:flex; gap:4px; padding:4px; background:var(--surface-2); border-radius:10px; margin-bottom:16px; }
        .eval-tab{ flex:1; border:0; background:transparent; border-radius:8px; padding:8px 10px; font-size:13px; font-weight:700; color:var(--muted); cursor:pointer; }
        .eval-tab.active{ background:#fff; color:var(--blue); box-shadow:0 1px 3px rgba(0,0,0,.1); }
        .eval-search{ display:flex; align-items:center; gap:8px; border:1px solid var(--line); border-radius:10px; padding:8px 10px; background:#fff; margin-bottom:14px; }
        .eval-search input{ border:0; outline:0; flex:1; font:inherit; font-size:13.5px; min-width:0; }
        .eval-row{ display:flex; align-items:flex-start; gap:12px; border:1px solid var(--line); border-radius:10px; background:#fff; padding:12px; margin-bottom:8px; cursor:pointer; transition:border-color .15s, box-shadow .15s; }
        .eval-row:hover{ border-color:var(--blue); }
        .eval-row.sel{ border-color:var(--blue); box-shadow:0 0 0 3px rgba(72,161,254,.12); }
        .eval-row h3{ font-size:14px; margin:0 0 5px; line-height:1.25; }
        .eval-meta{ display:flex; gap:6px; flex-wrap:wrap; align-items:center; }
        .eval-side{ position:sticky; top:20px; }
        .eval-empty{ text-align:center; padding:28px 18px; color:var(--muted); font-size:13.5px; }
        .eval-stats{ display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:18px; }
        .eval-stat{ background:#fff; border:1px solid var(--line); border-radius:12px; padding:14px; }
        .eval-stat .num{ font-size:24px; font-weight:800; color:var(--ink); }
        .eval-stat .lbl{ font-size:12px; color:var(--muted); margin-top:3px; }
        .eval-panel-head{ display:flex; justify-content:space-between; align-items:flex-start; gap:14px; margin-bottom:14px; }
        @media(max-width:980px){ .eval-grid{ grid-template-columns:1fr; } .eval-side{ position:static; } .eval-stats{ grid-template-columns:1fr; } .eval-head{ flex-direction:column; } }
      `}</style>

      <div className="content wide">
        <div className="eval-head">
          <div>
            <h1>Central de Avaliações</h1>
            <p className="muted" style={{ marginTop: '6px', fontSize: '14.5px' }}>
              Gerencie provas finais de cursos e quizzes por aula em um só lugar.
            </p>
          </div>
          <Link className="btn btn-ghost btn-sm" href="/admin/cursos">
            Voltar para cursos
          </Link>
        </div>

        <div className="eval-stats">
          <div className="eval-stat">
            <div className="num">{coursesWithFinalQuiz}</div>
            <div className="lbl">Cursos com prova final</div>
          </div>
          <div className="eval-stat">
            <div className="num">{lessonQuizzes.length}</div>
            <div className="lbl">Quizzes por aula</div>
          </div>
          <div className="eval-stat">
            <div className="num">{totalQuestions}</div>
            <div className="lbl">Questões em provas finais</div>
          </div>
        </div>

        <div className="eval-grid">
          <section className="card card-pad">
            <div className="eval-tabs">
              <button
                className={`eval-tab${activeView === 'provas' ? ' active' : ''}`}
                type="button"
                onClick={() => setActiveView('provas')}
              >
                Provas finais
              </button>
              <button
                className={`eval-tab${activeView === 'aulas' ? ' active' : ''}`}
                type="button"
                onClick={() => setActiveView('aulas')}
              >
                Quizzes por aula
              </button>
            </div>

            <div className="eval-search">
              <span className="muted" aria-hidden="true">⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar curso, aula ou avaliação..."
              />
            </div>

            {activeView === 'provas' && (
              <>
                {filteredCourses.map((course) => (
                  <button
                    key={course.id}
                    type="button"
                    className={`eval-row${selectedCourse?.id === course.id ? ' sel' : ''}`}
                    onClick={() => setSelectedCourse(course)}
                    style={{ width: '100%', textAlign: 'left' }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3>{course.title}</h3>
                      <div className="eval-meta">
                        {course.published ? (
                          <span className="badge green dot">Publicado</span>
                        ) : (
                          <span className="badge" style={{ background: '#fdeede', color: '#b5790f' }}>
                            Rascunho
                          </span>
                        )}
                        <span className="badge blue">{course.moduleCount} módulos</span>
                        <span className="badge blue">{course.lessonCount} aulas</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 800, color: course.finalQuiz ? 'var(--blue)' : 'var(--muted)' }}>
                        {course.finalQuiz ? `${course.finalQuiz.questionCount} q.` : 'Sem prova'}
                      </div>
                      <div className="muted" style={{ fontSize: '11.5px', marginTop: '3px' }}>
                        {course.finalQuiz ? `${course.finalQuiz.passScore}% / ${course.finalQuiz.attemptsAllowed} tent.` : 'Configurar'}
                      </div>
                    </div>
                  </button>
                ))}

                {filteredCourses.length === 0 && (
                  <div className="eval-empty">Nenhum curso encontrado.</div>
                )}
              </>
            )}

            {activeView === 'aulas' && (
              <>
                {filteredLessonQuizzes.map((quiz) => (
                  <div key={quiz.id} className="eval-row" style={{ cursor: 'default' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3>{quiz.title}</h3>
                      <p className="muted" style={{ fontSize: '12.5px', margin: '0 0 7px' }}>
                        {quiz.courseTitle} / {quiz.moduleTitle} / {quiz.lessonTitle}
                      </p>
                      <div className="eval-meta">
                        <span className="badge blue">{quiz.questionCount} questões</span>
                        <span className="badge">{quiz.passScore}% aprovação</span>
                        <span className="badge">{quiz.attemptsAllowed} tentativas</span>
                      </div>
                    </div>
                    <Link
                      className="btn btn-ghost btn-sm"
                      href={`/admin/cursos?courseId=${quiz.courseId}`}
                    >
                      Abrir curso
                    </Link>
                  </div>
                ))}

                {filteredLessonQuizzes.length === 0 && (
                  <div className="eval-empty">Nenhum quiz por aula encontrado.</div>
                )}
              </>
            )}
          </section>

          <aside className="eval-side">
            <div className="card card-pad">
              {selectedCourse ? (
                <>
                  <div className="eval-panel-head">
                    <div>
                      <h2 style={{ fontSize: '18px', margin: 0 }}>{selectedCourse.title}</h2>
                      <p className="muted" style={{ fontSize: '13px', marginTop: '5px' }}>
                        Prova final vinculada ao curso.
                      </p>
                    </div>
                    <Link className="btn btn-ghost btn-sm" href={`/cursos/${selectedCourse.slug}`} target="_blank">
                      Ver curso
                    </Link>
                  </div>

                  <QuizBuilder
                    targetType="course"
                    courseId={selectedCourse.id}
                    courseTitle={selectedCourse.title}
                    onClose={() => setSelectedCourse(null)}
                  />
                </>
              ) : (
                <div className="eval-empty">
                  Selecione um curso para criar ou editar a prova final.
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}
