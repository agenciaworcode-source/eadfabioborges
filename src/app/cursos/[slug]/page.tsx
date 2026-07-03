// ISR: página de curso é pública e raramente muda — revalida a cada 60 s
export const revalidate = 60

import { cache } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { PublicNav } from '@/components/layout/PublicNav'
import { PublicFooter } from '@/components/layout/PublicFooter'
import { CheckoutButton } from '@/components/checkout/CheckoutButton'
import { createClient } from '@/lib/supabase/server'
import { createClient as createPublicClient } from '@supabase/supabase-js'

interface PageProps {
  params: { slug: string }
}

interface LessonStub {
  id: string
}

interface ModuleRow {
  id: string
  title: string
  order: number
  is_free_preview: boolean
  lessons: LessonStub[]
}

interface CourseDetail {
  id: string
  slug: string
  title: string
  description: string
  price: number | null
  is_vip: boolean
  thumbnail_url: string | null
  modules: ModuleRow[]
}

function formatPrice(price: number | null, isVip: boolean): string {
  if (isVip) return 'Incluso nos planos'
  if (!price) return 'Gratuito'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)
}

// React.cache() garante 1 único round-trip ao Supabase por request,
// mesmo sendo chamado em generateMetadata e no componente da página.
const getCourse = cache(async (slug: string): Promise<CourseDetail | null> => {
  const supabase = createClient()
  const { data } = await supabase
    .from('courses')
    .select(
      'id, slug, title, description, price, is_vip, thumbnail_url, modules(id, title, order, is_free_preview, lessons(id))'
    )
    .eq('slug', slug)
    .eq('published', true)
    .single()

  return data as CourseDetail | null
})

// Pré-renderiza todos os slugs conhecidos em build time
export async function generateStaticParams() {
  const supabase = createPublicClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data } = await supabase.from('courses').select('slug').eq('published', true)
  return (data ?? []).map((c: { slug: string }) => ({ slug: c.slug }))
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ead.fabioborgesoficial.com.br'

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const course = await getCourse(params.slug)
  if (!course) return { title: 'Curso não encontrado | Mentoria Fábio Borges' }
  const description =
    course.description ?? `Conheça o curso ${course.title} da Mentoria Fábio Borges.`
  return {
    title: `${course.title} | Mentoria Fábio Borges`,
    description,
    openGraph: {
      title: `${course.title} | Mentoria Fábio Borges`,
      description,
      url: `${APP_URL}/cursos/${course.slug}`,
      type: 'website',
      images: course.thumbnail_url
        ? [{ url: course.thumbnail_url, width: 1200, height: 630 }]
        : [{ url: `${APP_URL}/og-default.png`, width: 1200, height: 630 }],
    },
  }
}

export default async function CursoDetailPage({ params }: PageProps) {
  const course = await getCourse(params.slug)
  if (!course) notFound()

  const modules = [...(course.modules ?? [])].sort((a, b) => a.order - b.order)
  const totalLessons = modules.reduce((acc, m) => acc + (m.lessons?.length ?? 0), 0)
  const priceLabel = formatPrice(course.price, course.is_vip)

  return (
    <>
      <style>{`
        .course-hero{ padding:56px 0 40px; }
        .course-hero-grid{ display:grid; grid-template-columns:1fr 360px; gap:48px; align-items:start; }
        .course-hero h1{ font-size:clamp(28px,4vw,46px); margin-bottom:16px; }
        .course-hero .desc{ font-size:17px; color:var(--ink-2); line-height:1.6; margin-bottom:24px; }
        .course-meta{ display:flex; gap:20px; flex-wrap:wrap; margin-bottom:24px; }
        .course-meta span{ font-size:13.5px; color:var(--muted); display:flex; align-items:center; gap:6px; }
        .course-meta svg{ width:15px; height:15px; flex:none; }
        .buy-card{ background:#fff; border:1px solid var(--line); border-radius:var(--r-xl); padding:28px; box-shadow:var(--shadow); position:sticky; top:80px; }
        .buy-card .price-big{ font-size:38px; font-weight:700; letter-spacing:-.04em; margin:0 0 6px; }
        .buy-card .price-sub{ font-size:13.5px; color:var(--muted); margin-bottom:22px; }
        .buy-card .perks{ list-style:none; padding:0; margin:20px 0 0; display:flex; flex-direction:column; gap:10px; }
        .buy-card .perks li{ font-size:13.5px; color:var(--ink-2); display:flex; gap:9px; align-items:flex-start; }
        .buy-card .perks svg{ color:var(--blue-600); flex:none; margin-top:1px; }
        .vip-tag{ background:var(--indigo-tint); color:var(--indigo-600); font-size:12px; font-weight:600; padding:4px 11px; border-radius:980px; display:inline-flex; margin-bottom:8px; }
        .modules-section{ padding:0 0 80px; }
        .modules-section h2{ font-size:26px; margin-bottom:24px; }
        .module-item{ background:#fff; border:1px solid var(--line); border-radius:var(--r-lg); padding:20px 24px; margin-bottom:12px; }
        .module-item .mh{ display:flex; justify-content:space-between; align-items:center; gap:16px; }
        .module-item .mn{ font-size:15.5px; font-weight:600; color:var(--ink); }
        .module-item .mc{ font-size:13px; color:var(--muted); white-space:nowrap; }
        .preview-badge{ background:var(--green-tint); color:#178a4a; font-size:11px; font-weight:600; padding:3px 9px; border-radius:980px; }
        @media(max-width:900px){
          .course-hero-grid{ grid-template-columns:1fr; }
          .buy-card{ position:static; }
        }
      `}</style>

      <PublicNav />

      <header className="course-hero">
        <div className="wrap course-hero-grid">
          <div>
            {course.thumbnail_url && (
              <div
                style={{
                  position: 'relative',
                  aspectRatio: '16/9',
                  borderRadius: 'var(--r-lg)',
                  overflow: 'hidden',
                  marginBottom: '20px',
                }}
              >
                <Image
                  src={course.thumbnail_url}
                  alt={course.title}
                  fill
                  priority
                  sizes="(max-width: 900px) 100vw, 60vw"
                  style={{ objectFit: 'cover' }}
                />
              </div>
            )}
            {course.is_vip && <span className="vip-tag">Incluso em todos os planos</span>}
            <h1>{course.title}</h1>
            {course.description && <p className="desc">{course.description}</p>}
            <div className="course-meta">
              <span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c0 1 2.5 3 6 3s6-2 6-3v-5" />
                </svg>
                {modules.length} {modules.length === 1 ? 'módulo' : 'módulos'}
              </span>
              <span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <path d="M8 21h8M12 17v4" />
                </svg>
                {totalLessons} {totalLessons === 1 ? 'aula' : 'aulas'}
              </span>
              <span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Certificado incluso
              </span>
            </div>
          </div>

          <div className="buy-card">
            <div className="price-big">{priceLabel}</div>
            {!course.is_vip && course.price && (
              <div className="price-sub">pagamento único · acesso vitalício</div>
            )}
            {course.is_vip && <div className="price-sub">incluso em qualquer plano ativo</div>}

            {course.is_vip ? (
              <>
                <a href="/planos" className="btn btn-primary btn-block">
                  Ver planos de mentoria
                </a>
                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--muted)',
                    textAlign: 'center',
                    marginTop: '12px',
                    lineHeight: 1.5,
                  }}
                >
                  Este curso está incluso em qualquer plano — Prata, Ouro, Diamante ou Macroempresa.
                </p>
              </>
            ) : (
              <CheckoutButton
                courseId={course.id}
                courseSlug={course.slug}
                label="Quero me matricular"
                className="btn btn-primary btn-block"
              />
            )}

            <ul className="perks">
              <li>
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                Acesso imediato após confirmação
              </li>
              <li>
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                Certificado digital verificável
              </li>
              <li>
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                Suporte da comunidade
              </li>
            </ul>
          </div>
        </div>
      </header>

      <section className="modules-section">
        <div className="wrap">
          <h2>Conteúdo do curso</h2>
          {modules.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>Conteúdo em preparação.</p>
          ) : (
            modules.map((mod) => (
              <div key={mod.id} className="module-item">
                <div className="mh">
                  <span className="mn">{mod.title}</span>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {mod.is_free_preview && <span className="preview-badge">Prévia grátis</span>}
                    <span className="mc">
                      {mod.lessons?.length ?? 0}{' '}
                      {(mod.lessons?.length ?? 0) === 1 ? 'aula' : 'aulas'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <PublicFooter />
    </>
  )
}
