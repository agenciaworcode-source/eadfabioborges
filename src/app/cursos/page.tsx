import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicNav } from '@/components/layout/PublicNav'
import { PublicFooter } from '@/components/layout/PublicFooter'
import { createClient } from '@/lib/supabase/server'

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? 'https://ead.fabioborgesoficial.com.br'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Cursos | Mentoria Fabio Borges',
  description:
    'Explore o catalogo de cursos praticos de estetica avancada, micropigmentacao e gestao da Mentoria Fabio Borges.',
  openGraph: {
    title: 'Cursos | Mentoria Fabio Borges',
    description:
      'Explore o catalogo de cursos praticos de estetica avancada, micropigmentacao e gestao da Mentoria Fabio Borges.',
    url: `${APP_URL}/cursos`,
    type: 'website',
    images: [{ url: `${APP_URL}/og-default.png`, width: 1200, height: 630 }],
  },
}

interface PageProps {
  searchParams?: {
    nivel?: string
    categoria?: string
  }
}

interface LessonRow {
  id: string
  duration_secs: number | null
}

interface ModuleRow {
  id: string
  lessons: LessonRow[] | null
}

interface CourseRow {
  id: string
  slug: string
  title: string
  description: string | null
  price: number | null
  is_vip: boolean | null
  thumbnail_url: string | null
  level: string | null
  category: string | null
  modules: ModuleRow[] | null
}

const LEVEL_LABELS: Record<string, string> = {
  todos: 'Todos os niveis',
  iniciante: 'Iniciante',
  intermediario: 'Intermediario',
  avancado: 'Avancado',
}

const THUMB_VARIANTS = ['', ' b2', ' b3', ' b4']

function normalizeFilter(value?: string): string {
  return (value ?? '').trim().toLowerCase()
}

function formatPrice(price: number | null, isVip: boolean): string {
  if (isVip) return 'Incluso no plano'
  if (!price) return 'Gratuito'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)
}

function formatDuration(totalSecs: number): string {
  if (!totalSecs) return 'Carga a definir'
  const hours = Math.floor(totalSecs / 3600)
  const mins = Math.round((totalSecs % 3600) / 60)
  if (hours > 0 && mins > 0) return `${hours}h ${mins}min`
  if (hours > 0) return `${hours}h`
  return `${mins}min`
}

function courseStats(course: CourseRow) {
  const modules = course.modules ?? []
  const lessons = modules.flatMap((module) => module.lessons ?? [])
  const durationSecs = lessons.reduce((sum, lesson) => sum + (lesson.duration_secs ?? 0), 0)

  return {
    moduleCount: modules.length,
    lessonCount: lessons.length,
    durationLabel: formatDuration(durationSecs),
  }
}

function buildFilterHref(params: { nivel?: string; categoria?: string }) {
  const query = new URLSearchParams()
  if (params.nivel) query.set('nivel', params.nivel)
  if (params.categoria) query.set('categoria', params.categoria)
  const qs = query.toString()
  return qs ? `/cursos?${qs}` : '/cursos'
}

const CourseIcon = () => (
  <svg className="cat-icn" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c0 1 2.5 3 6 3s6-2 6-3v-5" />
  </svg>
)

export default async function CursosPage({ searchParams }: PageProps) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('courses')
    .select(`
      id, slug, title, description, price, is_vip, thumbnail_url, level, category,
      modules(id, lessons(id, duration_secs))
    `)
    .eq('published', true)
    .order('created_at', { ascending: false })

  if (error) throw error

  const courses = (data ?? []) as unknown as CourseRow[]
  const selectedLevel = normalizeFilter(searchParams?.nivel)
  const selectedCategory = normalizeFilter(searchParams?.categoria)

  const categories = Array.from(
    new Set(courses.map((course) => course.category?.trim()).filter(Boolean) as string[])
  ).sort((a, b) => a.localeCompare(b, 'pt-BR'))

  const filteredCourses = courses.filter((course) => {
    const level = normalizeFilter(course.level ?? 'todos')
    const category = normalizeFilter(course.category ?? '')
    const levelMatch = !selectedLevel || selectedLevel === 'todos' || level === selectedLevel
    const categoryMatch = !selectedCategory || category === selectedCategory
    return levelMatch && categoryMatch
  })

  const totalLessons = courses.reduce((sum, course) => sum + courseStats(course).lessonCount, 0)
  const activeFilterCount = [selectedLevel && selectedLevel !== 'todos', selectedCategory].filter(Boolean).length

  return (
    <>
      <style>{`
        .courses-hero{ padding:54px 0 28px; }
        .courses-hero-grid{ display:grid; grid-template-columns:minmax(0,1fr) 340px; gap:42px; align-items:end; }
        .courses-hero h1{ font-size:clamp(34px,5vw,54px); margin:12px 0 14px; max-width:780px; }
        .courses-hero p{ font-size:17px; color:var(--ink-2); max-width:62ch; }
        .catalog-summary{ background:#fff; border:1px solid var(--line); border-radius:var(--r-lg); padding:18px; display:grid; grid-template-columns:repeat(3,1fr); gap:10px; box-shadow:var(--shadow-xs); }
        .catalog-summary .n{ font-size:24px; font-weight:700; color:var(--ink); letter-spacing:0; }
        .catalog-summary .l{ font-size:12px; color:var(--muted); margin-top:2px; }
        .catalog{ padding:18px 0 76px; }
        .filter-band{ display:flex; align-items:center; justify-content:space-between; gap:16px; border-top:1px solid var(--line); border-bottom:1px solid var(--line); padding:18px 0; margin-bottom:28px; }
        .filter-group{ display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
        .filter-label{ font-size:12px; font-weight:700; color:var(--faint); text-transform:uppercase; letter-spacing:.06em; margin-right:2px; }
        .filter-chip{ display:inline-flex; align-items:center; min-height:34px; padding:7px 12px; border-radius:999px; border:1px solid var(--line-2); color:var(--ink-2); background:#fff; font-size:13px; font-weight:600; }
        .filter-chip.on{ border-color:var(--indigo); color:var(--indigo-700); background:var(--indigo-tint); }
        .catalog-count{ color:var(--muted); font-size:13.5px; white-space:nowrap; }
        .catalog-grid{ display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:22px; }
        .course-card{ background:#fff; border:1px solid var(--line); border-radius:var(--r-lg); overflow:hidden; box-shadow:var(--shadow-xs); transition:transform .18s ease, box-shadow .18s ease, border-color .18s ease; display:flex; flex-direction:column; min-width:0; }
        .course-card:hover{ transform:translateY(-3px); box-shadow:var(--shadow); border-color:var(--line-2); }
        .course-card .thumb{ border-radius:0; aspect-ratio:16/9; }
        .course-card .body{ padding:18px; display:flex; flex-direction:column; flex:1; }
        .course-card h2{ font-size:18px; line-height:1.2; letter-spacing:-.02em; margin:10px 0 0; }
        .course-card .desc{ color:var(--muted); font-size:13.5px; line-height:1.48; margin-top:9px; min-height:40px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .meta-row{ display:flex; gap:7px; flex-wrap:wrap; align-items:center; }
        .meta-pill{ display:inline-flex; align-items:center; gap:6px; border-radius:999px; background:var(--surface-2); color:var(--muted); padding:5px 9px; font-size:12px; font-weight:600; }
        .course-stats{ display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin:16px 0; padding:12px 0; border-top:1px solid var(--line); border-bottom:1px solid var(--line); }
        .course-stats span{ display:block; font-size:12px; color:var(--muted); }
        .course-stats b{ display:block; font-size:13px; color:var(--ink); font-weight:700; margin-bottom:1px; }
        .course-card .foot{ display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:auto; }
        .course-card .price{ font-size:15px; color:var(--ink); }
        .vip-badge{ background:var(--indigo-tint); color:var(--indigo-600); font-size:12px; font-weight:700; padding:5px 10px; border-radius:980px; }
        .free-badge{ background:var(--green-tint); color:#178a4a; font-size:12px; font-weight:700; padding:5px 10px; border-radius:980px; }
        .empty-state{ text-align:center; padding:80px 20px; background:#fff; border:1px solid var(--line); border-radius:var(--r-lg); }
        .empty-state h2{ font-size:24px; margin-bottom:10px; color:var(--ink-2); font-weight:600; }
        .empty-state p{ color:var(--muted); font-size:15px; }
        @media(max-width:980px){
          .courses-hero-grid{ grid-template-columns:1fr; }
          .catalog-summary{ max-width:520px; }
          .catalog-grid{ grid-template-columns:repeat(2,minmax(0,1fr)); }
          .filter-band{ align-items:flex-start; flex-direction:column; }
          .catalog-count{ white-space:normal; }
        }
        @media(max-width:640px){
          .catalog-grid{ grid-template-columns:1fr; }
          .catalog-summary{ grid-template-columns:1fr 1fr; }
          .filter-group{ width:100%; }
          .filter-label{ width:100%; }
        }
      `}</style>

      <PublicNav />

      <header className="courses-hero">
        <div className="wrap courses-hero-grid">
          <div>
            <span className="eyebrow">Catalogo</span>
            <h1>Todos os cursos disponiveis</h1>
            <p>
              Escolha um curso publicado pela equipe e veja o conteudo, formato de acesso e detalhes
              antes de se matricular.
            </p>
          </div>
          <div className="catalog-summary" aria-label="Resumo do catalogo">
            <div>
              <div className="n">{courses.length}</div>
              <div className="l">cursos publicados</div>
            </div>
            <div>
              <div className="n">{categories.length}</div>
              <div className="l">categorias</div>
            </div>
            <div>
              <div className="n">{totalLessons}</div>
              <div className="l">aulas no catalogo</div>
            </div>
          </div>
        </div>
      </header>

      <section className="catalog">
        <div className="wrap">
          <div className="filter-band">
            <div className="filter-group">
              <span className="filter-label">Nivel</span>
              <Link
                className={`filter-chip${!selectedLevel || selectedLevel === 'todos' ? ' on' : ''}`}
                href={buildFilterHref({ categoria: selectedCategory })}
              >
                Todos
              </Link>
              {Object.entries(LEVEL_LABELS)
                .filter(([level]) => level !== 'todos')
                .map(([level, label]) => (
                  <Link
                    key={level}
                    className={`filter-chip${selectedLevel === level ? ' on' : ''}`}
                    href={buildFilterHref({ nivel: level, categoria: selectedCategory })}
                  >
                    {label}
                  </Link>
                ))}
            </div>

            {categories.length > 0 && (
              <div className="filter-group">
                <span className="filter-label">Categoria</span>
                <Link
                  className={`filter-chip${!selectedCategory ? ' on' : ''}`}
                  href={buildFilterHref({ nivel: selectedLevel })}
                >
                  Todas
                </Link>
                {categories.map((category) => (
                  <Link
                    key={category}
                    className={`filter-chip${selectedCategory === normalizeFilter(category) ? ' on' : ''}`}
                    href={buildFilterHref({ nivel: selectedLevel, categoria: category })}
                  >
                    {category}
                  </Link>
                ))}
              </div>
            )}

            <div className="catalog-count">
              {filteredCourses.length} curso{filteredCourses.length !== 1 ? 's' : ''}
              {activeFilterCount > 0 ? ' filtrados' : ''}
            </div>
          </div>

          {courses.length === 0 ? (
            <div className="empty-state">
              <h2>Nenhum curso disponivel no momento</h2>
              <p>Quando um curso for publicado no admin, ele aparece automaticamente aqui.</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="empty-state">
              <h2>Nenhum curso encontrado</h2>
              <p>Ajuste os filtros para ver outros cursos publicados.</p>
              <Link href="/cursos" className="btn btn-primary btn-sm" style={{ marginTop: '18px' }}>
                Limpar filtros
              </Link>
            </div>
          ) : (
            <div className="catalog-grid">
              {filteredCourses.map((course, index) => {
                const isVip = course.is_vip ?? false
                const stats = courseStats(course)
                return (
                  <Link key={course.id} className="course-card" href={`/cursos/${course.slug}`}>
                    <div className={`thumb${THUMB_VARIANTS[index % THUMB_VARIANTS.length]}`}>
                      {course.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={course.thumbnail_url}
                          alt={course.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <CourseIcon />
                      )}
                    </div>
                    <div className="body">
                      <div className="meta-row">
                        <span className="meta-pill">{LEVEL_LABELS[course.level ?? 'todos'] ?? course.level}</span>
                        {course.category && <span className="meta-pill">{course.category}</span>}
                      </div>

                      <h2>{course.title}</h2>
                      <p className="desc">
                        {course.description || 'Conteudo do curso em preparacao pela equipe.'}
                      </p>

                      <div className="course-stats" aria-label={`Resumo de ${course.title}`}>
                        <span>
                          <b>{stats.moduleCount}</b>
                          modulo{stats.moduleCount !== 1 ? 's' : ''}
                        </span>
                        <span>
                          <b>{stats.lessonCount}</b>
                          aula{stats.lessonCount !== 1 ? 's' : ''}
                        </span>
                        <span>
                          <b>{stats.durationLabel}</b>
                          duracao
                        </span>
                      </div>

                      <div className="foot">
                        <span className="price">{formatPrice(course.price, isVip)}</span>
                        {isVip && <span className="vip-badge">Plano</span>}
                        {!isVip && !course.price && <span className="free-badge">Gratis</span>}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <PublicFooter />
    </>
  )
}
