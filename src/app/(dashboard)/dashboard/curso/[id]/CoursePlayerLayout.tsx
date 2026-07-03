'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  CheckCircle2,
  PlayCircle,
  Lock,
  ChevronLeft as ChevronLeftIcon,
  ClipboardList,
} from 'lucide-react'
import { VimeoPlayer } from '@/components/player/VimeoPlayer'
import { YouTubePlayer } from '@/components/player/YouTubePlayer'
import { FinalAssessmentPanel } from '@/components/player/FinalAssessmentPanel'
import { Quiz } from '@/components/quiz/Quiz'
import { QuizResult } from '@/components/quiz/QuizResult'
import { useCourseProgress, useSaveProgress } from '@/hooks/use-progress'
import {
  useQuizByLesson,
  useQuizByCourse,
  useLastAttempt,
  useSubmitQuiz,
  type SubmitResult,
} from '@/hooks/use-quiz'
import { useAssignmentByLesson, useUploadAssignment } from '@/hooks/use-assignment'
import { AssignmentUpload } from '@/components/assignment/AssignmentUpload'

interface LessonRow {
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
}

interface ModuleRow {
  id: string
  title: string
  order: number
  lessons: LessonRow[]
}

interface CoursePlayerLayoutProps {
  courseId: string
  courseTitle: string
  modules: ModuleRow[]
  hasAccess: boolean
}

function formatMins(secs: number): string {
  const m = Math.round(secs / 60)
  return `${m}m`
}

function FallbackContent({ message }: { message: string }) {
  return (
    <div
      className="flex aspect-video items-center justify-center"
      style={{
        background: 'radial-gradient(120% 120% at 50% 40%, #1b2740, #0a0e16)',
      }}
    >
      <p className="text-sm" style={{ color: '#6a707a' }}>
        {message}
      </p>
    </div>
  )
}

// MÓDULO DESATIVADO — Avaliações/Quiz (desativado sem apagar)
const QUIZ_ENABLED = false

export function CoursePlayerLayout({
  courseId,
  courseTitle,
  modules,
  hasAccess,
}: CoursePlayerLayoutProps) {
  const { data: progressData } = useCourseProgress(courseId)
  const saveProgress = useSaveProgress(courseId)
  const lessons = useMemo(() => progressData?.lessons ?? {}, [progressData?.lessons])

  const allLessons = useMemo(
    () => modules.flatMap((m) => m.lessons ?? []).sort((a, b) => a.order - b.order),
    [modules]
  )

  const firstLesson = useMemo(
    () => allLessons.find((l) => !lessons[l.id]?.completed) ?? allLessons[0],
    [allLessons, lessons]
  )

  const [selectedLessonId, setSelectedLessonId] = useState<string>(firstLesson?.id ?? '')
  const [quizResult, setQuizResult] = useState<SubmitResult | null>(null)
  const [finalQuizResult, setFinalQuizResult] = useState<SubmitResult | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const [isFinalRetrying, setIsFinalRetrying] = useState(false)
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false)
  const [isSubmittingFinalQuiz, setIsSubmittingFinalQuiz] = useState(false)

  const selectedLesson = allLessons.find((l) => l.id === selectedLessonId)

  const totalLessons = allLessons.length
  const completedCount = allLessons.filter((l) => lessons[l.id]?.completed).length
  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

  const currentIndex = allLessons.findIndex((l) => l.id === selectedLessonId)
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null

  // Quiz da aula selecionada
  const { data: quizData } = useQuizByLesson(selectedLessonId)
  const quiz = quizData?.quiz ?? null
  const { data: finalQuizData } = useQuizByCourse(courseId)
  const finalQuiz = finalQuizData?.quiz ?? null

  // Última tentativa
  const { data: attemptData } = useLastAttempt(quiz?.id)
  const lastAttempt = attemptData?.attempt ?? null
  const attemptsUsed = attemptData?.attemptsUsed ?? 0
  const attemptsRemaining = quiz ? Math.max(0, quiz.attempts_allowed - attemptsUsed) : 0

  const { data: finalAttemptData } = useLastAttempt(finalQuiz?.id)
  const finalLastAttempt = finalAttemptData?.attempt ?? null
  const finalAttemptsUsed = finalAttemptData?.attemptsUsed ?? 0
  const finalAttemptsRemaining = finalQuiz
    ? Math.max(0, finalQuiz.attempts_allowed - finalAttemptsUsed)
    : 0

  const submitQuiz = useSubmitQuiz()

  // Assignment da aula selecionada
  const { data: assignmentData } = useAssignmentByLesson(selectedLessonId)
  const assignment = assignmentData?.assignment ?? null
  const submission = assignmentData?.submission ?? null
  const [isUploading, setIsUploading] = useState(false)
  const uploadAssignment = useUploadAssignment(selectedLessonId)

  async function handleUpload(file: File) {
    if (!assignment) return
    setIsUploading(true)
    try {
      await uploadAssignment(assignment.id, file)
    } finally {
      setIsUploading(false)
    }
  }

  // Ao trocar de aula, limpar resultado local e marcar não-vídeo como concluída
  function selectLesson(id: string) {
    setSelectedLessonId(id)
    setQuizResult(null)
    setIsRetrying(false)

    const lesson = allLessons.find((l) => l.id === id)
    const lessonType = lesson?.type ?? 'video'
    if (lesson && lessonType !== 'video' && !lessons[id]?.completed) {
      void saveProgress(id, 0, true)
    }
  }

  async function handleQuizSubmit(answers: Record<string, string>) {
    if (!quiz) return
    setIsSubmittingQuiz(true)
    try {
      const result = await submitQuiz(quiz.id, selectedLessonId, answers)
      setIsRetrying(false)
      setQuizResult(result)
    } finally {
      setIsSubmittingQuiz(false)
    }
  }

  async function handleFinalQuizSubmit(answers: Record<string, string>) {
    if (!finalQuiz) return
    setIsSubmittingFinalQuiz(true)
    try {
      const result = await submitQuiz(finalQuiz.id, undefined, answers)
      setIsFinalRetrying(false)
      setFinalQuizResult(result)
    } finally {
      setIsSubmittingFinalQuiz(false)
    }
  }

  // Resultado a exibir: resultado local (recém submetido) ou última tentativa persistida
  // isRetrying=true força exibir o formulário mesmo que exista lastAttempt
  const displayResult: SubmitResult | null = isRetrying
    ? null
    : (quizResult ??
      (lastAttempt
        ? {
            score: lastAttempt.score,
            passed: lastAttempt.passed,
            attemptsUsed,
            attemptsAllowed: quiz?.attempts_allowed ?? 1,
            correctAnswers: undefined,
          }
        : null))

  const finalDisplayResult: SubmitResult | null = isFinalRetrying
    ? null
    : (finalQuizResult ??
      (finalLastAttempt
        ? {
            score: finalLastAttempt.score,
            passed: finalLastAttempt.passed,
            attemptsUsed: finalAttemptsUsed,
            attemptsAllowed: finalQuiz?.attempts_allowed ?? 1,
            correctAnswers: undefined,
          }
        : null))

  // Determinar se aula tem quiz pendente (tem quiz, não passou ainda)
  const lessonHasPendingQuiz = (lessonId: string) => {
    // Esta informação não está disponível no rail sem fetch por aula
    // Usamos apenas para a aula selecionada
    if (lessonId !== selectedLessonId) return false
    return quiz !== null && !lastAttempt?.passed && !quizResult?.passed
  }

  return (
    <div className="flex min-h-screen flex-col" style={{ background: '#0c0d10' }}>
      {/* Top bar */}
      <header
        className="sticky top-0 z-20 flex h-[60px] items-center justify-between px-5"
        style={{ background: '#0f1014', borderBottom: '1px solid #1c1e24' }}
      >
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm"
          style={{ color: '#aeb4be' }}
        >
          <ChevronLeft className="h-[18px] w-[18px]" />
          {courseTitle}
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm" style={{ color: '#6a707a' }}>
            {completedCount} / {totalLessons} aulas
          </span>
        </div>
      </header>

      {/* Grid: main + rail */}
      <div
        className="player-grid grid flex-1"
        style={{ gridTemplateColumns: '1fr 360px', minHeight: 'calc(100vh - 60px)' }}
      >
        {/* Main */}
        <main>
          {/* Player / Content */}
          {selectedLesson && hasAccess ? (
            (() => {
              const lessonType = selectedLesson.type ?? 'video'
              switch (lessonType) {
                case 'video':
                  if (selectedLesson.youtube_url) {
                    return (
                      <YouTubePlayer
                        key={selectedLesson.id}
                        youtubeUrl={selectedLesson.youtube_url}
                        lessonId={selectedLesson.id}
                        courseId={courseId}
                        durationSecs={selectedLesson.duration_secs}
                        completionPercent={selectedLesson.completion_percent}
                        thumbnailUrl={selectedLesson.video_thumbnail_url}
                        initialWatchedSecs={lessons[selectedLesson.id]?.watchedSecs ?? 0}
                        onComplete={() => {
                          if (nextLesson) selectLesson(nextLesson.id)
                        }}
                      />
                    )
                  }
                  if (!selectedLesson.vimeo_id) {
                    return <FallbackContent message="Video nao configurado" />
                  }
                  return (
                    <VimeoPlayer
                      key={selectedLesson.id}
                      vimeoId={selectedLesson.vimeo_id}
                      lessonId={selectedLesson.id}
                      courseId={courseId}
                      durationSecs={selectedLesson.duration_secs}
                      initialWatchedSecs={lessons[selectedLesson.id]?.watchedSecs ?? 0}
                      onComplete={() => {
                        if (nextLesson) selectLesson(nextLesson.id)
                      }}
                    />
                  )
                case 'text':
                  return (
                    <div
                      className="prose max-w-none p-6"
                      style={{ background: '#fff', minHeight: '400px' }}
                      dangerouslySetInnerHTML={{
                        __html: selectedLesson.content_body ?? '',
                      }}
                    />
                  )
                case 'pdf':
                  if (!selectedLesson.pdf_url) {
                    return <FallbackContent message="Conteudo indisponivel" />
                  }
                  return (
                    <iframe
                      src={selectedLesson.pdf_url}
                      className="w-full border-0"
                      style={{ minHeight: '600px' }}
                      title={selectedLesson.title}
                    />
                  )
                case 'embed': {
                  if (!selectedLesson.embed_url) {
                    return <FallbackContent message="Conteudo indisponivel" />
                  }
                  const isHtml = selectedLesson.embed_url.trimStart().startsWith('<')
                  if (isHtml) {
                    return (
                      <div
                        className="w-full"
                        dangerouslySetInnerHTML={{ __html: selectedLesson.embed_url }}
                      />
                    )
                  }
                  return (
                    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                      <iframe
                        src={selectedLesson.embed_url}
                        className="absolute inset-0 h-full w-full border-0"
                        title={selectedLesson.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )
                }
                default:
                  return <FallbackContent message="Tipo de aula desconhecido" />
              }
            })()
          ) : (
            <div
              className="flex aspect-video items-center justify-center"
              style={{
                background: 'radial-gradient(120% 120% at 50% 40%, #1b2740, #0a0e16)',
              }}
            >
              {!hasAccess ? (
                <div className="flex flex-col items-center gap-3 text-center">
                  <Lock className="h-12 w-12" style={{ color: '#6a707a' }} />
                  <p className="text-sm" style={{ color: '#6a707a' }}>
                    Faca upgrade para acessar este conteudo
                  </p>
                  <Link
                    href="/dashboard/plano"
                    className="rounded-full px-5 py-2 text-sm font-semibold text-white"
                    style={{ background: '#5c74b4' }}
                  >
                    Ver planos
                  </Link>
                </div>
              ) : (
                <p style={{ color: '#6a707a' }}>Selecione uma aula</p>
              )}
            </div>
          )}

          {/* Lesson info */}
          {selectedLesson && (
            <div className="pb-0" style={{ background: '#f2f2f2' }}>
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1
                      className="text-2xl font-semibold"
                      style={{ color: '#1d1d1f', letterSpacing: '-0.03em' }}
                    >
                      {selectedLesson.title}
                    </h1>
                    <p className="mt-1 text-sm" style={{ color: '#6e6e73' }}>
                      {selectedLesson.duration_secs > 0
                        ? `${formatMins(selectedLesson.duration_secs)} · `
                        : ''}
                      {lessons[selectedLesson.id]?.completed ? 'Concluída' : 'Em andamento'}
                    </p>
                  </div>
                  {lessons[selectedLesson.id]?.completed && (
                    <div
                      className="flex items-center gap-2 text-sm font-semibold"
                      style={{ color: '#178a4a' }}
                    >
                      <CheckCircle2 className="h-5 w-5" />
                      Concluída
                    </div>
                  )}
                </div>

                {/* Navegação entre aulas */}
                <div
                  className="mt-6 flex justify-between pt-5"
                  style={{ borderTop: '1px solid #e6e6e8' }}
                >
                  <button
                    onClick={() => prevLesson && selectLesson(prevLesson.id)}
                    disabled={!prevLesson}
                    className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition disabled:opacity-40"
                    style={{ borderColor: '#d8d8db', color: '#1d1d1f' }}
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                    Aula anterior
                  </button>
                  <button
                    onClick={() => nextLesson && selectLesson(nextLesson.id)}
                    disabled={!nextLesson}
                    className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-40"
                    style={{ background: '#1d1d1f' }}
                  >
                    Próxima aula
                    <ChevronLeft className="h-4 w-4 rotate-180" />
                  </button>
                </div>
              </div>

              {/* Seção de Quiz — DESATIVADA (QUIZ_ENABLED = false) */}
              {QUIZ_ENABLED && quiz && (
                <>
                  {displayResult ? (
                    <QuizResult
                      result={displayResult}
                      attemptsRemaining={
                        quizResult
                          ? Math.max(0, quizResult.attemptsAllowed - quizResult.attemptsUsed)
                          : attemptsRemaining
                      }
                      onRetry={() => {
                        setQuizResult(null)
                        setIsRetrying(true)
                      }}
                    />
                  ) : (
                    <Quiz quiz={quiz} onSubmit={handleQuizSubmit} isSubmitting={isSubmittingQuiz} />
                  )}
                </>
              )}

              {/* Seção de Tarefa */}
              {assignment && (
                <AssignmentUpload
                  assignment={assignment}
                  submission={submission}
                  onUpload={handleUpload}
                  isUploading={isUploading}
                />
              )}

              {/* FinalAssessmentPanel — DESATIVADO (QUIZ_ENABLED = false) */}
              {QUIZ_ENABLED && (
                <FinalAssessmentPanel
                  quiz={finalQuiz}
                  completedLessons={completedCount}
                  totalLessons={totalLessons}
                  result={finalDisplayResult}
                  attemptsRemaining={
                    finalQuizResult
                      ? Math.max(0, finalQuizResult.attemptsAllowed - finalQuizResult.attemptsUsed)
                      : finalAttemptsRemaining
                  }
                  isSubmitting={isSubmittingFinalQuiz}
                  onSubmit={handleFinalQuizSubmit}
                  onRetry={() => {
                    setFinalQuizResult(null)
                    setIsFinalRetrying(true)
                  }}
                />
              )}
            </div>
          )}
        </main>

        {/* Rail — lesson list */}
        <aside
          className="overflow-y-auto"
          style={{
            background: '#0f1014',
            borderLeft: '1px solid #1c1e24',
            maxHeight: 'calc(100vh - 60px)',
            position: 'sticky',
            top: '60px',
          }}
        >
          {/* Progress header */}
          <div className="p-5" style={{ borderBottom: '1px solid #1c1e24' }}>
            <div className="font-semibold text-sm" style={{ color: '#e7e9ee' }}>
              Conteúdo do curso
            </div>
            <div className="mt-1 text-xs" style={{ color: '#6a707a' }}>
              {completedCount} / {totalLessons} aulas · {progressPct}%
            </div>
            <div
              className="mt-3 h-[7px] overflow-hidden rounded-full"
              style={{ background: '#1d2026' }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${progressPct}%`,
                  background: 'linear-gradient(90deg, #48a1fe, #5c74b4)',
                }}
              />
            </div>
          </div>

          {/* Modules + lessons */}
          {modules.map((mod) => {
            const sortedLessons = [...(mod.lessons ?? [])].sort((a, b) => a.order - b.order)
            return (
              <div key={mod.id}>
                <div
                  className="px-5 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: '#6a707a' }}
                >
                  {mod.title}
                </div>
                {sortedLessons.map((lesson) => {
                  const prog = lessons[lesson.id]
                  const isCompleted = prog?.completed ?? false
                  const isSelected = lesson.id === selectedLessonId
                  const isInProgress = !isCompleted && (prog?.watchedSecs ?? 0) > 0
                  const hasPendingQuiz = QUIZ_ENABLED && lessonHasPendingQuiz(lesson.id)

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => selectLesson(lesson.id)}
                      className="flex w-full items-center gap-3 px-5 py-[11px] text-left text-[13.5px] transition"
                      style={{
                        color: isSelected ? '#fff' : '#aeb4be',
                        background: isSelected ? '#16181d' : 'transparent',
                        borderLeft: isSelected ? '2px solid #48a1fe' : '2px solid transparent',
                      }}
                    >
                      {/* Ícone de estado */}
                      <span
                        className="grid h-6 w-6 flex-none place-items-center rounded-full"
                        style={{
                          background: isCompleted
                            ? 'rgba(43,191,106,.18)'
                            : hasPendingQuiz
                              ? 'rgba(255,179,0,.15)'
                              : isInProgress || isSelected
                                ? 'rgba(72,161,254,.2)'
                                : '#1d2026',
                          color: isCompleted
                            ? '#3fd17f'
                            : hasPendingQuiz
                              ? '#ffb300'
                              : isInProgress || isSelected
                                ? '#48a1fe'
                                : '#6a707a',
                        }}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : hasPendingQuiz ? (
                          <ClipboardList className="h-[11px] w-[11px]" />
                        ) : (
                          <PlayCircle className="h-[11px] w-[11px]" />
                        )}
                      </span>

                      <span className="flex-1 leading-snug">{lesson.title}</span>

                      <span className="ml-auto text-xs" style={{ color: '#6a707a' }}>
                        {formatMins(lesson.duration_secs)}
                      </span>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </aside>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .player-grid { grid-template-columns: 1fr !important; }
          .player-rail { display: none; }
        }
      `}</style>
    </div>
  )
}
