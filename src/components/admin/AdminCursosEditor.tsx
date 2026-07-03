'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { ModuleEditor, type ModuleRow } from './ModuleEditor'

export interface CourseRow {
  id: string
  slug: string
  title: string
  description: string | null
  price: number | null
  published: boolean | null
  is_vip?: boolean
  thumbnail_url?: string | null
  level: string
  category: string
  access_type: 'free' | 'paid' | 'plan' | 'manual'
  certificate_enabled: boolean
  access_days: number | null
  moduleCount: number
  lessonCount: number
  enrollmentCount: number
  totalDurationSecs: number
  modules: ModuleRow[]
}

interface EditForm {
  title: string
  description: string
  price: string
  published: boolean
  is_vip: boolean
  level: string
  category: string
  access_type: 'free' | 'paid' | 'plan' | 'manual'
  certificate_enabled: boolean
  access_days: string
}

type Tab = 'conteudo' | 'alunos' | 'estatisticas'
type NewCourseStep = 'basico' | 'detalhes' | 'acesso'

const NEW_COURSE_STEPS: Array<{ id: NewCourseStep; label: string }> = [
  { id: 'basico', label: 'Básico' },
  { id: 'detalhes', label: 'Detalhes' },
  { id: 'acesso', label: 'Acesso' },
]

interface EnrollmentEntry {
  id: string
  userId: string
  name: string
  email: string
  status: string
  enrolledAt: string
  progress: number
  completedLessons: number
  totalLessons: number
}

interface StatsData {
  total: number
  concluded: number
  avgProgress: number
  totalCompletions: number
}

const LEVEL_LABELS: Record<string, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
  todos: 'Todos os níveis',
}

function formatDuration(secs: number): string {
  if (!secs) return '—'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  if (h > 0) return `${h}h ${m}min`
  return `${m}min`
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso))
}

export function AdminCursosEditor({
  courses: initialCourses,
  initialCourseId,
}: {
  courses: CourseRow[]
  initialCourseId?: string
}) {
  const initialSelectedCourse =
    initialCourses.find((course) => course.id === initialCourseId) ?? initialCourses[0]
  const [mounted, setMounted] = useState(false)
  const [courses, setCourses] = useState<CourseRow[]>(initialCourses)
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedCourse?.id ?? null)
  const [courseModules, setCourseModules] = useState<ModuleRow[]>(
    initialSelectedCourse?.modules ?? []
  )
  const [activeTab, setActiveTab] = useState<Tab>('conteudo')

  // Filtros da listagem
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')

  const [form, setForm] = useState<EditForm>(() => {
    const first = initialSelectedCourse
    return first
      ? {
          title: first.title,
          description: first.description ?? '',
          price: String(first.price ?? 0),
          published: first.published ?? false,
          is_vip: first.is_vip ?? false,
          level: first.level ?? 'todos',
          category: first.category ?? '',
          access_type: first.access_type ?? 'paid',
          certificate_enabled: first.certificate_enabled ?? true,
          access_days: first.access_days != null ? String(first.access_days) : '',
        }
      : {
          title: '',
          description: '',
          price: '0',
          published: false,
          is_vip: false,
          level: 'todos',
          category: '',
          access_type: 'paid' as const,
          certificate_enabled: true,
          access_days: '',
        }
  })

  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [thumbUrl, setThumbUrl] = useState<string | null>(
    initialSelectedCourse?.thumbnail_url ?? null
  )
  const [thumbMsg, setThumbMsg] = useState('')
  const [uploadingThumb, setUploadingThumb] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [duplicating, setDuplicating] = useState(false)

  // Novo curso
  const [showNewForm, setShowNewForm] = useState(false)
  const [newCourseStep, setNewCourseStep] = useState<NewCourseStep>('basico')
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [newIsVip, setNewIsVip] = useState(false)
  const [newPublished, setNewPublished] = useState(true)
  const [newLevel, setNewLevel] = useState('todos')
  const [newCategory, setNewCategory] = useState('')
  const [creating, setCreating] = useState(false)
  const [createMsg, setCreateMsg] = useState('')

  // Aba Alunos
  const [enrollments, setEnrollments] = useState<EnrollmentEntry[]>([])
  const [enrollLoading, setEnrollLoading] = useState(false)
  const [enrollSearch, setEnrollSearch] = useState('')
  const [removingId, setRemovingId] = useState<string | null>(null)

  // Aba Estatísticas
  const [stats, setStats] = useState<StatsData | null>(null)
  const [courseEnrollmentCache, setCourseEnrollmentCache] = useState<
    Record<string, { enrollments: EnrollmentEntry[]; stats: StatsData }>
  >({})

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase())
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'published' && c.published) ||
        (statusFilter === 'draft' && !c.published)
      return matchSearch && matchStatus
    })
  }, [courses, search, statusFilter])

  const publishedCount = courses.filter((c) => c.published).length
  const draftCount = courses.length - publishedCount

  function selectCourse(course: CourseRow) {
    setSelectedId(course.id)
    setCourseModules(course.modules ?? [])
    setForm({
      title: course.title,
      description: course.description ?? '',
      price: String(course.price ?? 0),
      published: course.published ?? false,
      is_vip: course.is_vip ?? false,
      level: course.level ?? 'todos',
      category: course.category ?? '',
      access_type: course.access_type ?? 'paid',
      certificate_enabled: course.certificate_enabled ?? true,
      access_days: course.access_days != null ? String(course.access_days) : '',
    })
    setThumbUrl(course.thumbnail_url ?? null)
    setThumbMsg('')
    setSaveMsg('')
    setActiveTab('conteudo')
    const cached = courseEnrollmentCache[course.id]
    setEnrollments(cached?.enrollments ?? [])
    setStats(cached?.stats ?? null)
  }

  const loadEnrollments = useCallback(
    async (courseId: string) => {
      const cached = courseEnrollmentCache[courseId]
      if (cached) {
        setEnrollments(cached.enrollments)
        setStats(cached.stats)
        return
      }

      setEnrollLoading(true)
      try {
        const res = await fetch(`/api/admin/courses/${courseId}/enrollments`)
        const data = (await res.json()) as { enrollments?: EnrollmentEntry[]; error?: string }
        if (res.ok) {
          const nextEnrollments = data.enrollments ?? []
          setEnrollments(nextEnrollments)
          const total = nextEnrollments.length
          const concluded = nextEnrollments.filter((e) => e.status === 'completed').length
          const avgProgress =
            total > 0 ? Math.round(nextEnrollments.reduce((s, e) => s + e.progress, 0) / total) : 0
          const nextStats = { total, concluded, avgProgress, totalCompletions: concluded }
          setStats(nextStats)
          setCourseEnrollmentCache((prev) => ({
            ...prev,
            [courseId]: { enrollments: nextEnrollments, stats: nextStats },
          }))
        }
      } catch {
        // silently fail
      } finally {
        setEnrollLoading(false)
      }
    },
    [courseEnrollmentCache]
  )

  useEffect(() => {
    if (!selectedId) return
    if (activeTab === 'alunos' || activeTab === 'estatisticas') {
      void loadEnrollments(selectedId)
    }
  }, [activeTab, selectedId, loadEnrollments])

  async function handleRemoveEnrollment(enrollmentId: string) {
    if (!window.confirm('Remover esta matrícula? O aluno perderá acesso ao curso.')) return
    setRemovingId(enrollmentId)
    try {
      const res = await fetch(`/api/admin/enrollments/${enrollmentId}`, { method: 'DELETE' })
      if (res.ok) {
        setEnrollments((prev) => prev.filter((e) => e.id !== enrollmentId))
        if (selectedId) {
          setCourseEnrollmentCache((prev) => {
            const next = { ...prev }
            delete next[selectedId]
            return next
          })
          setCourses((prev) =>
            prev.map((c) =>
              c.id === selectedId
                ? { ...c, enrollmentCount: Math.max(0, c.enrollmentCount - 1) }
                : c
            )
          )
        }
      }
    } catch {
      // silently fail
    } finally {
      setRemovingId(null)
    }
  }

  async function handleThumbUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !selectedId) return
    setUploadingThumb(true)
    setThumbMsg('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`/api/admin/courses/${selectedId}/thumbnail`, {
        method: 'POST',
        body: fd,
      })
      const data = (await res.json()) as { thumbnailUrl?: string; error?: string }
      if (!res.ok) {
        setThumbMsg(`Erro: ${data.error ?? 'falha ao enviar'}`)
      } else {
        setThumbUrl(data.thumbnailUrl ?? null)
        setThumbMsg('Thumbnail atualizado!')
        setCourses((prev) =>
          prev.map((c) => (c.id === selectedId ? { ...c, thumbnail_url: data.thumbnailUrl } : c))
        )
      }
    } catch {
      setThumbMsg('Erro de conexão.')
    } finally {
      setUploadingThumb(false)
      e.target.value = ''
    }
  }

  async function handleSave() {
    if (!selectedId) return
    setSaving(true)
    setSaveMsg('')
    try {
      const accessDaysValue =
        form.access_days === '' || form.access_days === '0' ? null : parseInt(form.access_days, 10)
      const res = await fetch(`/api/admin/courses/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          price:
            form.access_type === 'paid' ? parseFloat(form.price) || 0 : parseFloat(form.price) || 0,
          published: form.published,
          is_vip: form.is_vip,
          level: form.level,
          category: form.category,
          access_type: form.access_type,
          certificate_enabled: form.certificate_enabled,
          access_days: accessDaysValue,
        }),
      })
      const data = (await res.json()) as {
        error?: string
        title?: string
        description?: string
        price?: number
        published?: boolean
        is_vip?: boolean
        level?: string
        category?: string
        access_type?: 'free' | 'paid' | 'plan' | 'manual'
        certificate_enabled?: boolean
        access_days?: number | null
      }
      if (!res.ok) {
        setSaveMsg(`Erro: ${data.error ?? 'falha ao salvar'}`)
      } else {
        setSaveMsg('Salvo!')
        setCourses((prev) =>
          prev.map((c) =>
            c.id === selectedId
              ? {
                  ...c,
                  title: data.title ?? c.title,
                  description: data.description ?? c.description,
                  price: data.price ?? c.price,
                  published: data.published ?? c.published,
                  is_vip: data.is_vip ?? c.is_vip,
                  level: data.level ?? c.level,
                  category: data.category ?? c.category,
                  access_type: data.access_type ?? c.access_type,
                  certificate_enabled: data.certificate_enabled ?? c.certificate_enabled,
                  access_days: data.access_days !== undefined ? data.access_days : c.access_days,
                }
              : c
          )
        )
      }
    } catch {
      setSaveMsg('Erro de conexão.')
    } finally {
      setSaving(false)
    }
  }

  async function handlePublishNow() {
    if (!selectedId || form.published) return
    setSaving(true)
    setSaveMsg('')
    try {
      const res = await fetch(`/api/admin/courses/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: true }),
      })
      const data = (await res.json()) as { error?: string; published?: boolean }
      if (!res.ok) {
        setSaveMsg(`Erro: ${data.error ?? 'falha ao publicar'}`)
        return
      }
      setForm((prev) => ({ ...prev, published: true }))
      setCourses((prev) =>
        prev.map((course) => (course.id === selectedId ? { ...course, published: true } : course))
      )
      setSaveMsg('Curso publicado!')
    } catch {
      setSaveMsg('Erro de conexao.')
    } finally {
      setSaving(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle) return
    setCreating(true)
    setCreateMsg('')
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          price: parseFloat(newPrice) || 0,
          published: newPublished,
          isVip: newIsVip,
          level: newLevel,
          category: newCategory,
        }),
      })
      const data = (await res.json()) as {
        error?: string
        course?: Omit<
          CourseRow,
          'moduleCount' | 'lessonCount' | 'enrollmentCount' | 'totalDurationSecs' | 'modules'
        >
      }
      if (!res.ok) {
        setCreateMsg(`Erro: ${data.error ?? 'falha ao criar'}`)
      } else {
        if (!data.course) {
          setCreateMsg('Erro: curso criado, mas resposta inválida')
          return
        }

        const createdCourse: CourseRow = {
          ...data.course,
          level: data.course.level ?? 'todos',
          category: data.course.category ?? '',
          access_type: data.course.access_type ?? 'paid',
          certificate_enabled: data.course.certificate_enabled ?? true,
          access_days: data.course.access_days ?? null,
          moduleCount: 0,
          lessonCount: 0,
          enrollmentCount: 0,
          totalDurationSecs: 0,
          modules: [],
        }

        setCourses((prev) => [createdCourse, ...prev])
        selectCourse(createdCourse)
        setShowNewForm(false)
        setCreateMsg('Curso criado!')
        setNewTitle('')
        setNewDesc('')
        setNewPrice('')
        setNewIsVip(false)
        setNewPublished(true)
        setNewLevel('todos')
        setNewCategory('')
        setNewCourseStep('basico')
      }
    } catch {
      setCreateMsg('Erro de conexão.')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete() {
    if (!selectedId) return
    if (!window.confirm('Excluir este curso? Esta ação não pode ser desfeita.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/courses/${selectedId}`, { method: 'DELETE' })
      if (res.ok) {
        const remaining = courses.filter((c) => c.id !== selectedId)
        setCourses(remaining)
        const next = remaining[0] ?? null
        if (next) selectCourse(next)
        else {
          setSelectedId(null)
          setCourseModules([])
        }
      } else {
        const data = (await res.json()) as { error?: string }
        setSaveMsg(`Erro ao excluir: ${data.error ?? 'falha'}`)
      }
    } catch {
      setSaveMsg('Erro de conexão.')
    } finally {
      setDeleting(false)
    }
  }

  async function handleDuplicate() {
    if (!selectedId) return
    setDuplicating(true)
    try {
      const res = await fetch(`/api/admin/courses/${selectedId}/duplicate`, { method: 'POST' })
      const data = (await res.json()) as { error?: string; courseId?: string }
      if (!res.ok) {
        setSaveMsg(`Erro ao duplicar: ${data.error ?? 'falha'}`)
      } else {
        setSaveMsg('Curso duplicado! Atualizando...')
        setTimeout(() => window.location.reload(), 1000)
      }
    } catch {
      setSaveMsg('Erro de conexão.')
    } finally {
      setDuplicating(false)
    }
  }

  const selectedCourse = courses.find((c) => c.id === selectedId)
  const newCourseStepIndex = NEW_COURSE_STEPS.findIndex((step) => step.id === newCourseStep)
  const isLastNewCourseStep = newCourseStepIndex === NEW_COURSE_STEPS.length - 1
  const canAdvanceNewCourse = newCourseStep !== 'basico' || newTitle.trim().length > 0

  function closeNewCourseForm() {
    setShowNewForm(false)
    setCreateMsg('')
    setNewCourseStep('basico')
    setNewPublished(true)
  }

  function nextNewCourseStep() {
    if (!canAdvanceNewCourse) {
      setCreateMsg('Erro: informe o título do curso')
      return
    }
    setCreateMsg('')
    const next = NEW_COURSE_STEPS[Math.min(newCourseStepIndex + 1, NEW_COURSE_STEPS.length - 1)]
    setNewCourseStep(next.id)
  }

  function prevNewCourseStep() {
    setCreateMsg('')
    const prev = NEW_COURSE_STEPS[Math.max(newCourseStepIndex - 1, 0)]
    setNewCourseStep(prev.id)
  }
  const filteredEnrollments = useMemo(
    () =>
      enrollments.filter(
        (e) =>
          !enrollSearch ||
          e.name.toLowerCase().includes(enrollSearch.toLowerCase()) ||
          e.email.toLowerCase().includes(enrollSearch.toLowerCase())
      ),
    [enrollments, enrollSearch]
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="content wide">
        <div className="card card-pad">
          <p className="muted">Carregando editor de cursos...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        .ac-grid{ display:grid; grid-template-columns:minmax(260px,340px) minmax(720px,1fr); gap:24px; align-items:start; }
        .crow{ display:flex; align-items:center; gap:14px; padding:13px 14px; border:1px solid var(--line); border-radius:var(--r); background:#fff; margin-bottom:8px; cursor:pointer; transition:border-color .15s; }
        .crow:hover{ border-color:var(--blue); }
        .crow.sel{ border-color:var(--blue); box-shadow:0 0 0 3px rgba(72,161,254,.12); }
        .crow .mini{ width:52px; height:34px; border-radius:7px; flex:none; background:linear-gradient(135deg,var(--ink),#3a3f4b); overflow:hidden; }
        .crow .mini img{ width:100%;height:100%;object-fit:cover; }
        .editor{ position:sticky; top:20px; min-width:0; }
        .editor > .card{ width:100%; }
        .curriculum-panel{ width:100%; max-width:920px; margin:16px auto 0; padding-top:14px; border-top:1px solid var(--line); }
        .new-course-form{ background:var(--surface-2); border-radius:var(--r); padding:18px; margin-bottom:16px; overflow:hidden; }
        .new-course-head{ display:flex; justify-content:space-between; align-items:flex-start; gap:14px; margin-bottom:14px; }
        .new-course-head h3{ font-size:15px; margin:0; }
        .wizard-steps{ display:flex; gap:6px; flex-wrap:wrap; margin-bottom:14px; }
        .wizard-step{ min-width:84px; border:1px solid var(--line-2); background:#fff; color:var(--muted); border-radius:9px; padding:7px 10px; font-size:12px; font-weight:700; text-align:center; cursor:pointer; }
        .wizard-step.active{ border-color:var(--blue); color:var(--blue); box-shadow:0 0 0 3px rgba(72,161,254,.12); }
        .wizard-step.done{ color:var(--ink-2); }
        .wizard-window{ overflow:hidden; min-height:220px; }
        .wizard-track{ display:grid; grid-template-columns:repeat(3,100%); transition:transform .22s ease; }
        .wizard-panel{ min-height:220px; padding-right:1px; }
        .wizard-grid{ display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px; }
        .wizard-actions{ display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:14px; padding-top:14px; border-top:1px solid var(--line); }
        .wizard-actions .right{ display:flex; align-items:center; gap:8px; }
        .thumb-wrap{ position:relative; background:linear-gradient(135deg,var(--ink),#3a3f4b); border-radius:var(--r); aspect-ratio:16/8; overflow:hidden; display:grid; place-items:center; }
        .thumb-wrap .thumb-btn{ position:absolute; }
        .tabs{ display:flex; gap:2px; background:var(--surface-2); border-radius:10px; padding:4px; margin-bottom:20px; }
        .tab{ flex:1; padding:8px 6px; border-radius:8px; border:none; background:transparent; font-size:13px; font-weight:600; color:var(--muted); cursor:pointer; transition:all .15s; text-align:center; }
        .tab.active{ background:#fff; color:var(--blue); box-shadow:0 1px 3px rgba(0,0,0,.1); }
        .enroll-row{ display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid var(--line); font-size:13.5px; }
        .enroll-row:last-child{ border-bottom:none; }
        .prog-bar{ flex:1; height:5px; background:#eef0f3; border-radius:999px; overflow:hidden; }
        .prog-bar span{ display:block; height:100%; background:var(--blue); }
        .stat-mini{ background:var(--surface-2); border-radius:var(--r); padding:12px 14px; }
        .stat-mini .n{ font-size:22px; font-weight:700; color:var(--ink); }
        .stat-mini .l{ font-size:12px; color:var(--muted); margin-top:2px; }
        .search-bar-sm{ display:flex; align-items:center; gap:8px; background:var(--surface-2); border:1px solid var(--line-2); border-radius:var(--r); padding:7px 12px; margin-bottom:12px; }
        .search-bar-sm input{ border:none; background:transparent; font-size:13.5px; flex:1; outline:none; }
        .filter-row{ display:flex; gap:10px; margin-bottom:16px; flex-wrap:wrap; }
        .sel-sm{ padding:8px 12px; border-radius:var(--r); border:1px solid var(--line-2); background:#fff; font-size:13.5px; font-family:inherit; color:var(--ink); }
        @media (max-width:1100px){
          .ac-grid{ grid-template-columns:1fr; }
          .editor{ position:static; }
          .curriculum-panel{ max-width:none; }
          .new-course-head,.wizard-actions{ flex-direction:column; align-items:stretch; }
          .wizard-actions .right{ justify-content:flex-end; }
          .wizard-grid{ grid-template-columns:1fr; }
        }
      `}</style>

      <div className="topbar">
        <div className="crumb">
          <a href="/admin">Admin</a> <span>›</span> <b>Cursos</b>
        </div>
        <div className="avatar sm" style={{ background: 'var(--ink)' }}>
          FB
        </div>
      </div>

      <div className="content wide">
        <div className="flex between aic">
          <div>
            <h1 style={{ fontSize: '26px' }}>Cursos</h1>
            <p className="muted" style={{ marginTop: '5px', fontSize: '14px' }}>
              {courses.length} curso{courses.length !== 1 ? 's' : ''} · {publishedCount} publicado
              {publishedCount !== 1 ? 's' : ''}, {draftCount} rascunho{draftCount !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => {
              setShowNewForm((value) => !value)
              setCreateMsg('')
              setNewCourseStep('basico')
            }}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Novo curso
          </button>
        </div>

        {showNewForm && (
          <div className="new-course-form" style={{ marginTop: '16px' }}>
            <h3 style={{ display: 'none' }}>Criar novo curso</h3>
            <form
              onSubmit={(e) => {
                void handleCreate(e)
              }}
            >
              <div className="new-course-head">
                <div>
                  <h3>Criar novo curso</h3>
                  <p className="muted" style={{ fontSize: '12.5px', marginTop: '4px' }}>
                    Etapa {newCourseStepIndex + 1} de {NEW_COURSE_STEPS.length}
                  </p>
                </div>
                <button className="btn btn-ghost btn-sm" type="button" onClick={closeNewCourseForm}>
                  Fechar
                </button>
              </div>

              <div className="wizard-steps">
                {NEW_COURSE_STEPS.map((step, index) => (
                  <button
                    key={step.id}
                    type="button"
                    className={`wizard-step${step.id === newCourseStep ? ' active' : ''}${index < newCourseStepIndex ? ' done' : ''}`}
                    onClick={() => {
                      if (index > newCourseStepIndex && !canAdvanceNewCourse) {
                        setCreateMsg('Erro: informe o titulo do curso')
                        return
                      }
                      setCreateMsg('')
                      setNewCourseStep(step.id)
                    }}
                  >
                    {index + 1}. {step.label}
                  </button>
                ))}
              </div>

              <div className="wizard-window">
                <div
                  className="wizard-track"
                  style={{ transform: `translateX(-${newCourseStepIndex * 100}%)` }}
                >
                  <section className="wizard-panel">
                    <div className="wizard-grid">
                      <div className="field">
                        <label>Titulo</label>
                        <input
                          className="input"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          placeholder="Nome do curso"
                          required
                        />
                      </div>
                      <div className="field">
                        <label>Categoria</label>
                        <input
                          className="input"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          placeholder="Ex: Estetica Facial"
                        />
                      </div>
                    </div>
                    <div className="field">
                      <label>Descricao</label>
                      <textarea
                        className="input"
                        rows={4}
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        placeholder="Descricao do curso"
                        style={{ resize: 'vertical' }}
                      />
                    </div>
                  </section>

                  <section className="wizard-panel">
                    <div className="wizard-grid">
                      <div className="field">
                        <label>Preco (R$)</label>
                        <input
                          className="input"
                          type="number"
                          min="0"
                          step="0.01"
                          value={newPrice}
                          onChange={(e) => setNewPrice(e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      <div className="field">
                        <label>Nivel</label>
                        <select
                          className="input"
                          value={newLevel}
                          onChange={(e) => setNewLevel(e.target.value)}
                        >
                          <option value="todos">Todos os niveis</option>
                          <option value="iniciante">Iniciante</option>
                          <option value="intermediario">Intermediario</option>
                          <option value="avancado">Avancado</option>
                        </select>
                      </div>
                    </div>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'var(--ink-2)',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={newIsVip}
                        onChange={(e) => setNewIsVip(e.target.checked)}
                      />
                      Acesso VIP
                    </label>
                  </section>

                  <section className="wizard-panel">
                    <div className="wizard-grid">
                      <div className="field">
                        <label>Titulo</label>
                        <input className="input" value={newTitle || 'Sem titulo'} readOnly />
                      </div>
                      <div className="field">
                        <label>Preco</label>
                        <input
                          className="input"
                          value={newPrice ? `R$ ${newPrice}` : 'Gratuito'}
                          readOnly
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span className="badge">
                        {newLevel === 'todos' ? 'Todos os niveis' : LEVEL_LABELS[newLevel]}
                      </span>
                      {newCategory && <span className="badge">{newCategory}</span>}
                      {newPublished && <span className="badge blue">Publicado</span>}
                      {newIsVip && (
                        <span
                          className="badge"
                          style={{ background: 'var(--indigo-tint)', color: 'var(--indigo-600)' }}
                        >
                          VIP
                        </span>
                      )}
                    </div>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'var(--ink-2)',
                        cursor: 'pointer',
                        marginTop: '16px',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={newPublished}
                        onChange={(e) => setNewPublished(e.target.checked)}
                      />
                      Publicar ao criar
                    </label>
                  </section>
                </div>
              </div>

              <div className="wizard-actions">
                <div>
                  {createMsg && (
                    <span
                      className={createMsg.startsWith('Erro') ? 'muted' : 'blue'}
                      style={{ fontSize: '13px' }}
                    >
                      {createMsg}
                    </span>
                  )}
                </div>
                <div className="right">
                  <button
                    className="btn btn-ghost btn-sm"
                    type="button"
                    onClick={prevNewCourseStep}
                    disabled={newCourseStepIndex === 0}
                  >
                    Voltar
                  </button>
                  {isLastNewCourseStep ? (
                    <button
                      className="btn btn-primary btn-sm"
                      type="submit"
                      disabled={creating || !newTitle.trim()}
                    >
                      {creating ? 'Criando...' : 'Criar curso'}
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary btn-sm"
                      type="button"
                      onClick={nextNewCourseStep}
                    >
                      Proximo
                    </button>
                  )}
                </div>
              </div>

              <fieldset disabled style={{ display: 'none' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    marginBottom: '12px',
                  }}
                >
                  <div className="field">
                    <label>Título</label>
                    <input
                      className="input"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Nome do curso"
                      required
                    />
                  </div>
                  <div className="field">
                    <label>Categoria</label>
                    <input
                      className="input"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Ex: Estética Facial"
                    />
                  </div>
                </div>
                <div className="field" style={{ marginBottom: '12px' }}>
                  <label>Descrição</label>
                  <textarea
                    className="input"
                    rows={2}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Descrição do curso"
                    style={{ resize: 'vertical' }}
                  />
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    marginBottom: '14px',
                  }}
                >
                  <div className="field">
                    <label>Preço (R$)</label>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="field">
                    <label>Nível</label>
                    <select
                      className="input"
                      value={newLevel}
                      onChange={(e) => setNewLevel(e.target.value)}
                    >
                      <option value="todos">Todos os níveis</option>
                      <option value="iniciante">Iniciante</option>
                      <option value="intermediario">Intermediário</option>
                      <option value="avancado">Avançado</option>
                    </select>
                  </div>
                </div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '14px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--ink-2)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={newIsVip}
                    onChange={(e) => setNewIsVip(e.target.checked)}
                  />
                  Acesso VIP (exclusivo por plano)
                </label>
                <div className="flex gap12" style={{ alignItems: 'center' }}>
                  <button className="btn btn-primary btn-sm" type="submit" disabled={creating}>
                    {creating ? 'Criando...' : 'Criar curso'}
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    type="button"
                    onClick={() => {
                      setShowNewForm(false)
                      setCreateMsg('')
                    }}
                  >
                    Cancelar
                  </button>
                  {createMsg && (
                    <span
                      className={createMsg.startsWith('Erro') ? 'muted' : 'blue'}
                      style={{ fontSize: '13px' }}
                    >
                      {createMsg}
                    </span>
                  )}
                </div>
              </fieldset>
            </form>
          </div>
        )}

        <div className="ac-grid" style={{ marginTop: '20px' }}>
          {/* Lista de cursos */}
          <div>
            {/* Filtros */}
            <div className="filter-row">
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#fff',
                  border: '1px solid var(--line-2)',
                  borderRadius: 'var(--r)',
                  padding: '8px 12px',
                  minWidth: '200px',
                }}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  style={{
                    border: 'none',
                    background: 'transparent',
                    fontSize: '13.5px',
                    flex: 1,
                    outline: 'none',
                  }}
                  placeholder="Buscar curso..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                className="sel-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'published' | 'draft')}
              >
                <option value="all">Todos</option>
                <option value="published">Publicados</option>
                <option value="draft">Rascunhos</option>
              </select>
            </div>

            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className={`crow${course.id === selectedId ? ' sel' : ''}`}
                onClick={() => selectCourse(course)}
              >
                <div className="mini">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {course.thumbnail_url && <img src={course.thumbnail_url} alt="" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: '14px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {course.title}
                  </div>
                  <div className="muted" style={{ fontSize: '12px', marginTop: '2px' }}>
                    {course.moduleCount}m · {course.lessonCount}a ·{' '}
                    {formatDuration(course.totalDurationSecs)} · {course.enrollmentCount} aluno
                    {course.enrollmentCount !== 1 ? 's' : ''}
                    {course.category ? ` · ${course.category}` : ''}
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '4px',
                    flexShrink: 0,
                  }}
                >
                  {course.published ? (
                    <span className="badge green dot">Publicado</span>
                  ) : (
                    <span className="badge" style={{ background: '#fdeede', color: '#b5790f' }}>
                      Rascunho
                    </span>
                  )}
                  {course.level !== 'todos' && (
                    <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                      {LEVEL_LABELS[course.level] ?? course.level}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {filteredCourses.length === 0 && (
              <div className="card card-pad muted" style={{ textAlign: 'center' }}>
                Nenhum curso encontrado
              </div>
            )}
          </div>

          {/* Editor lateral */}
          {selectedCourse && (
            <aside className="editor">
              <div className="card card-pad">
                {/* Abas */}
                <div className="tabs">
                  <button
                    className={`tab${activeTab === 'conteudo' ? ' active' : ''}`}
                    onClick={() => setActiveTab('conteudo')}
                  >
                    Conteúdo
                  </button>
                  <button
                    className={`tab${activeTab === 'alunos' ? ' active' : ''}`}
                    onClick={() => setActiveTab('alunos')}
                  >
                    Alunos{' '}
                    {selectedCourse.enrollmentCount > 0
                      ? `(${selectedCourse.enrollmentCount})`
                      : ''}
                  </button>
                  <button
                    className={`tab${activeTab === 'estatisticas' ? ' active' : ''}`}
                    onClick={() => setActiveTab('estatisticas')}
                  >
                    Stats
                  </button>
                </div>

                {/* ─── ABA CONTEÚDO ─── */}
                {activeTab === 'conteudo' && (
                  <>
                    <div className="flex between aic" style={{ marginBottom: '14px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {form.published ? (
                          <span className="badge green dot">Publicado</span>
                        ) : (
                          <span
                            className="badge"
                            style={{ background: '#fdeede', color: '#b5790f' }}
                          >
                            Rascunho
                          </span>
                        )}
                        {!form.published && (
                          <button
                            className="btn btn-primary btn-sm"
                            type="button"
                            onClick={() => {
                              void handlePublishNow()
                            }}
                            disabled={saving}
                          >
                            {saving ? 'Publicando...' : 'Publicar agora'}
                          </button>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <a
                          href={`/cursos/${selectedCourse.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost btn-sm"
                          title="Ver página pública"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M15 3h6v6M10 14 21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
                          </svg>
                        </a>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            void handleDuplicate()
                          }}
                          disabled={duplicating}
                          title="Duplicar curso"
                        >
                          {duplicating ? (
                            '...'
                          ) : (
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <rect x="9" y="9" width="13" height="13" rx="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Thumbnail */}
                    <div style={{ marginBottom: '14px' }}>
                      <div className="thumb-wrap" style={{ marginBottom: '8px' }}>
                        {thumbUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumbUrl}
                            alt="thumbnail"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '8px',
                              color: 'rgba(255,255,255,.5)',
                            }}
                          >
                            <svg
                              width="32"
                              height="32"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            >
                              <rect x="3" y="3" width="18" height="18" rx="2" />
                              <circle cx="8.5" cy="8.5" r="1.5" />
                              <polyline points="21 15 16 10 5 21" />
                            </svg>
                            <span style={{ fontSize: '12px' }}>Sem thumbnail</span>
                          </div>
                        )}
                        <label
                          className="thumb-btn"
                          style={{
                            position: 'absolute',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '7px 14px',
                            borderRadius: '8px',
                            background: 'rgba(255,255,255,.92)',
                            border: '1px solid rgba(0,0,0,.1)',
                            fontSize: '13px',
                            fontWeight: 600,
                            color: '#1a1a2e',
                            cursor: uploadingThumb ? 'wait' : 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,.15)',
                            transition: 'background .15s',
                          }}
                        >
                          {uploadingThumb ? (
                            <>
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                style={{ animation: 'spin 1s linear infinite' }}
                              >
                                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                              </svg>{' '}
                              Enviando...
                            </>
                          ) : (
                            <>
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                              </svg>{' '}
                              {thumbUrl ? 'Trocar imagem' : 'Adicionar imagem'}
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            style={{ display: 'none' }}
                            disabled={uploadingThumb}
                            onChange={(e) => {
                              void handleThumbUpload(e)
                            }}
                          />
                        </label>
                        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                      </div>
                      {thumbMsg && (
                        <div
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 500,
                            background: thumbMsg.startsWith('Erro') ? '#fff5f5' : '#f0fdf4',
                            color: thumbMsg.startsWith('Erro') ? '#c53030' : '#166534',
                            border: `1px solid ${thumbMsg.startsWith('Erro') ? '#fed7d7' : '#bbf7d0'}`,
                          }}
                        >
                          {thumbMsg}
                        </div>
                      )}
                      <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '6px' }}>
                        JPEG, PNG ou WebP · máximo 5 MB · proporção recomendada 16:9
                      </p>
                    </div>

                    <div className="field" style={{ marginBottom: '12px' }}>
                      <label>Título</label>
                      <input
                        className="input"
                        value={form.title}
                        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      />
                    </div>

                    <div className="field" style={{ marginBottom: '12px' }}>
                      <label>Descrição</label>
                      <textarea
                        className="input"
                        rows={2}
                        value={form.description}
                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        style={{ resize: 'vertical' }}
                      />
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '10px',
                        marginBottom: '12px',
                      }}
                    >
                      {form.access_type === 'paid' && (
                        <div className="field">
                          <label>Preço (R$)</label>
                          <input
                            className="input"
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.price}
                            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                          />
                        </div>
                      )}
                      <div className="field">
                        <label>Nível</label>
                        <select
                          className="input"
                          value={form.level}
                          onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
                        >
                          <option value="todos">Todos os níveis</option>
                          <option value="iniciante">Iniciante</option>
                          <option value="intermediario">Intermediário</option>
                          <option value="avancado">Avançado</option>
                        </select>
                      </div>
                    </div>

                    <div className="field" style={{ marginBottom: '12px' }}>
                      <label>Categoria</label>
                      <input
                        className="input"
                        value={form.category}
                        onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                        placeholder="Ex: Estética Facial"
                      />
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        marginBottom: '14px',
                      }}
                    >
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: 'var(--ink-2)',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={form.published}
                          onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
                        />
                        Publicado
                      </label>
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: 'var(--ink-2)',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={form.is_vip}
                          onChange={(e) => setForm((f) => ({ ...f, is_vip: e.target.checked }))}
                        />
                        Acesso VIP
                      </label>
                    </div>

                    {/* ─── CONFIGURAÇÕES DE ACESSO (Story 15.2) ─── */}
                    <div
                      style={{
                        borderTop: '1px solid var(--line)',
                        paddingTop: '14px',
                        marginBottom: '14px',
                      }}
                    >
                      <h4
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: 'var(--ink-2)',
                          marginBottom: '12px',
                        }}
                      >
                        Configurações de Acesso
                      </h4>

                      <div className="field" style={{ marginBottom: '12px' }}>
                        <label>Tipo de acesso</label>
                        <select
                          className="input"
                          value={form.access_type}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              access_type: e.target.value as EditForm['access_type'],
                            }))
                          }
                        >
                          <option value="free">Gratuito</option>
                          <option value="paid">Pago</option>
                          <option value="plan">Por Plano (assinatura)</option>
                          <option value="manual">Manual (admin atribui)</option>
                        </select>
                      </div>

                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: 'var(--ink-2)',
                          marginBottom: '12px',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={form.certificate_enabled}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, certificate_enabled: e.target.checked }))
                          }
                        />
                        Emitir certificado ao concluir
                      </label>

                      <div className="field" style={{ marginBottom: '4px' }}>
                        <label>Dias de acesso após matrícula</label>
                        <input
                          className="input"
                          type="number"
                          min="0"
                          value={form.access_days}
                          onChange={(e) => setForm((f) => ({ ...f, access_days: e.target.value }))}
                          placeholder="0 (vitalício)"
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '4px', fontSize: '12px', color: 'var(--muted)' }}>
                      Duração total: {formatDuration(selectedCourse.totalDurationSecs)}
                    </div>

                    <div
                      style={{
                        border: '1px solid var(--line)',
                        borderRadius: '10px',
                        padding: '12px',
                        background: 'var(--surface-2)',
                        margin: '14px 0',
                      }}
                    >
                      <div className="flex between aic" style={{ gap: '12px' }}>
                        <div>
                          <h4 style={{ fontSize: '13.5px', margin: '0 0 4px' }}>
                            Avaliações do curso
                          </h4>
                          <p className="muted" style={{ fontSize: '12.5px', margin: 0 }}>
                            Configure prova final e revise quizzes por aula na Central de
                            Avaliações.
                          </p>
                        </div>
                        <a
                          className="btn btn-ghost btn-sm"
                          href={`/admin/avaliacoes?courseId=${selectedCourse.id}`}
                        >
                          Abrir
                        </a>
                      </div>
                    </div>

                    {selectedId && (
                      <div className="curriculum-panel">
                        <ModuleEditor
                          courseId={selectedId}
                          modules={courseModules}
                          onModulesChange={(newModules) => {
                            setCourseModules(newModules)
                            setCourses((prev) =>
                              prev.map((c) =>
                                c.id === selectedId
                                  ? {
                                      ...c,
                                      modules: newModules,
                                      moduleCount: newModules.length,
                                      lessonCount: newModules.reduce(
                                        (s, m) => s + m.lessons.length,
                                        0
                                      ),
                                    }
                                  : c
                              )
                            )
                          }}
                        />
                      </div>
                    )}

                    <div className="flex gap8" style={{ marginTop: '16px' }}>
                      <button
                        className="btn btn-primary"
                        style={{ flex: 1 }}
                        onClick={() => {
                          void handleSave()
                        }}
                        disabled={saving}
                      >
                        {saving ? 'Salvando...' : 'Salvar'}
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: '#e53e3e', borderColor: '#fed7d7' }}
                        onClick={() => {
                          void handleDelete()
                        }}
                        disabled={deleting}
                      >
                        {deleting ? (
                          '...'
                        ) : (
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4h6v2" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {saveMsg && (
                      <p
                        className={saveMsg.startsWith('Erro') ? 'muted' : 'blue'}
                        style={{ fontSize: '13px', marginTop: '8px' }}
                      >
                        {saveMsg}
                      </p>
                    )}
                  </>
                )}

                {/* ─── ABA ALUNOS ─── */}
                {activeTab === 'alunos' && (
                  <>
                    <div className="flex between aic" style={{ marginBottom: '14px' }}>
                      <h3 style={{ fontSize: '15px' }}>
                        {filteredEnrollments.length} aluno
                        {filteredEnrollments.length !== 1 ? 's' : ''}
                      </h3>
                    </div>
                    <div className="search-bar-sm">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="11" cy="11" r="7" />
                        <path d="m21 21-4.3-4.3" />
                      </svg>
                      <input
                        placeholder="Buscar aluno..."
                        value={enrollSearch}
                        onChange={(e) => setEnrollSearch(e.target.value)}
                      />
                    </div>
                    {enrollLoading && (
                      <p
                        className="muted"
                        style={{ fontSize: '13px', textAlign: 'center', padding: '20px 0' }}
                      >
                        Carregando...
                      </p>
                    )}
                    {!enrollLoading && filteredEnrollments.length === 0 && (
                      <p
                        className="muted"
                        style={{ fontSize: '13px', textAlign: 'center', padding: '20px 0' }}
                      >
                        Nenhum aluno matriculado
                      </p>
                    )}
                    <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
                      {filteredEnrollments.map((e) => (
                        <div key={e.id} className="enroll-row">
                          <div
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '50%',
                              background: 'var(--blue)',
                              display: 'grid',
                              placeItems: 'center',
                              color: '#fff',
                              fontSize: '11px',
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {e.name
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: '13px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {e.name}
                            </div>
                            <div
                              style={{
                                fontSize: '11.5px',
                                color: 'var(--muted)',
                                marginBottom: '4px',
                              }}
                            >
                              {formatDate(e.enrolledAt)}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div className="prog-bar">
                                <span style={{ width: `${e.progress}%` }} />
                              </div>
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  color: 'var(--ink-2)',
                                  flexShrink: 0,
                                }}
                              >
                                {e.progress}%
                              </span>
                            </div>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'flex-end',
                              gap: '4px',
                              flexShrink: 0,
                            }}
                          >
                            {e.status === 'completed' ? (
                              <span className="badge green dot" style={{ fontSize: '11px' }}>
                                Concluído
                              </span>
                            ) : (
                              <span
                                className="badge"
                                style={{
                                  fontSize: '11px',
                                  background: '#e8f4ff',
                                  color: '#1a6aab',
                                }}
                              >
                                Ativo
                              </span>
                            )}
                            <button
                              style={{
                                fontSize: '11px',
                                color: '#e53e3e',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '0',
                              }}
                              onClick={() => {
                                void handleRemoveEnrollment(e.id)
                              }}
                              disabled={removingId === e.id}
                            >
                              {removingId === e.id ? '...' : 'Remover'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* ─── ABA ESTATÍSTICAS ─── */}
                {activeTab === 'estatisticas' && (
                  <>
                    {enrollLoading && (
                      <p
                        className="muted"
                        style={{ fontSize: '13px', textAlign: 'center', padding: '20px 0' }}
                      >
                        Carregando...
                      </p>
                    )}
                    {!enrollLoading && stats && (
                      <>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '10px',
                            marginBottom: '18px',
                          }}
                        >
                          <div className="stat-mini">
                            <div className="n">{stats.total}</div>
                            <div className="l">Matriculados</div>
                          </div>
                          <div className="stat-mini">
                            <div className="n">{stats.concluded}</div>
                            <div className="l">Concluíram</div>
                          </div>
                          <div className="stat-mini">
                            <div className="n">{stats.avgProgress}%</div>
                            <div className="l">Progresso médio</div>
                          </div>
                          <div className="stat-mini">
                            <div className="n">
                              {stats.total > 0
                                ? Math.round((stats.concluded / stats.total) * 100)
                                : 0}
                              %
                            </div>
                            <div className="l">Taxa conclusão</div>
                          </div>
                        </div>

                        <h4 style={{ fontSize: '13.5px', fontWeight: 700, marginBottom: '12px' }}>
                          Distribuição de progresso
                        </h4>
                        {[
                          {
                            label: 'Não iniciado (0%)',
                            count: enrollments.filter((e) => e.progress === 0).length,
                          },
                          {
                            label: 'Em progresso (1-99%)',
                            count: enrollments.filter((e) => e.progress > 0 && e.progress < 100)
                              .length,
                          },
                          {
                            label: 'Concluído (100%)',
                            count: enrollments.filter((e) => e.progress === 100).length,
                          },
                        ].map((row) => (
                          <div key={row.label} style={{ marginBottom: '10px' }}>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '13px',
                                marginBottom: '4px',
                              }}
                            >
                              <span className="muted">{row.label}</span>
                              <b>{row.count}</b>
                            </div>
                            <div
                              style={{
                                height: '6px',
                                background: '#eef0f3',
                                borderRadius: '999px',
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  height: '100%',
                                  background: 'var(--blue)',
                                  width: `${stats.total > 0 ? Math.round((row.count / stats.total) * 100) : 0}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                    {!enrollLoading && !stats && (
                      <p
                        className="muted"
                        style={{ fontSize: '13px', textAlign: 'center', padding: '20px 0' }}
                      >
                        Sem dados de progresso ainda
                      </p>
                    )}
                  </>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>
    </>
  )
}
