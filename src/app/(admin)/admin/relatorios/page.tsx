import { createClient } from '@/lib/supabase/server'
import { RelatoriosPeriodSelector } from '@/components/admin/RelatoriosPeriodSelector'
import { PLAN_LABELS, PLAN_COLORS } from '@/config/plans'

function formatCurrency(v: number) {
  if (v >= 1_000_000)
    return `R$ ${(v / 1_000_000).toFixed(1).replace('.', ',')}M`
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}k`
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(v)
}

function buildConicGradient(
  distribution: Record<string, number>,
  total: number
): string {
  if (total === 0) return '#eef0f3'
  let acc = 0
  const segments: string[] = []
  for (const plan of ['free', 'prata', 'ouro', 'diamante']) {
    const count = distribution[plan] ?? 0
    const pct = (count / total) * 100
    if (pct === 0) continue
    const color = PLAN_COLORS[plan]
    segments.push(
      `${color} ${acc.toFixed(1)}% ${(acc + pct).toFixed(1)}%`
    )
    acc += pct
  }
  return `conic-gradient(${segments.join(', ')})`
}

export default async function AdminRelatoriosPage({
  searchParams,
}: {
  searchParams: { period?: string }
}) {
  const supabase = createClient()

  // Preços dos planos (fonte única: tabela plans)
  const { data: plansData } = await supabase
    .from('plans')
    .select('id, price_monthly')
  const planPrices = Object.fromEntries(
    ((plansData ?? []) as Array<{ id: string; price_monthly: number }>).map((p) => [
      p.id,
      p.price_monthly / 100,
    ])
  )
  const period = searchParams?.period ?? '12m'

  const monthsBack = period === '6m' ? 6 : period === 'year' ? 12 : 12
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - monthsBack)
  startDate.setDate(1)
  startDate.setHours(0, 0, 0, 0)

  // Subscriptions no período
  const { data: subsData } = await supabase
    .from('subscriptions')
    .select('plan, status, period_start')
    .gte('period_start', startDate.toISOString())

  const subs = (subsData ?? []) as Array<{
    plan: string
    status: string
    period_start: string
  }>

  // Receita total estimada
  const totalRevenue = subs.reduce(
    (sum, s) => sum + (planPrices[(s.plan ?? '').toLowerCase()] ?? 0),
    0
  )

  // Ticket médio
  const activeSubs = subs.filter((s) => s.status === 'active')
  const ticketMedio =
    activeSubs.length > 0 ? totalRevenue / subs.length : 0

  // Churn: cancelados no último mês
  const lastMonth = new Date()
  lastMonth.setMonth(lastMonth.getMonth() - 1)
  const canceledThisMonth = subs.filter(
    (s) =>
      s.status === 'canceled' &&
      new Date(s.period_start) >= lastMonth
  ).length
  const churnRate =
    subs.length > 0
      ? ((canceledThisMonth / subs.length) * 100).toFixed(1)
      : '0.0'

  // Receita por mês (últimos 12 meses)
  const monthlyRevenue: Record<string, number> = {}
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthlyRevenue[key] = 0
  }
  for (const s of subs) {
    const key = s.period_start.slice(0, 7)
    if (key in monthlyRevenue) {
      monthlyRevenue[key] +=
        planPrices[(s.plan ?? '').toLowerCase()] ?? 0
    }
  }

  const monthlyValues = Object.values(monthlyRevenue)
  const monthlyKeys = Object.keys(monthlyRevenue)
  const maxRevenue = Math.max(...monthlyValues, 1)
  const revenueBarHeights = monthlyValues.map((v) =>
    Math.max(4, Math.round((v / maxRevenue) * 100))
  )

  const monthLabels = monthlyKeys.map((k) => {
    const [year, month] = k.split('-')
    return new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(
      new Date(Number(year), Number(month) - 1, 1)
    )
  })

  // Distribuição por plano (all-time users)
  const { data: usersData } = await supabase
    .from('users')
    .select('plan')
    .neq('role', 'admin')

  const planDist: Record<string, number> = {
    free: 0,
    prata: 0,
    ouro: 0,
    diamante: 0,
  }
  const totalUsers = (usersData ?? []).length
  for (const u of usersData ?? []) {
    const plan = ((u as { plan: string | null }).plan ?? 'free').toLowerCase()
    if (plan in planDist) planDist[plan]++
  }
  const donutGradient = buildConicGradient(planDist, totalUsers)

  // Ranking de cursos mais assistidos
  const { data: progressData } = await supabase
    .from('lesson_progress')
    .select('lesson_id, completed')
    .eq('completed', true)

  // Join lessons → modules → courses
  const { data: lessonsData } = await supabase
    .from('lessons')
    .select('id, module_id, modules(course_id, courses(title))')

  type LessonWithCourse = {
    id: string
    module_id: string
    modules: {
      course_id: string
      courses: { title: string } | null
    } | null
  }

  const lessons = (lessonsData ?? []) as unknown as LessonWithCourse[]
  const lessonToCourse: Record<string, string> = {}
  const courseTitles: Record<string, string> = {}
  for (const l of lessons) {
    if (l.modules?.course_id) {
      lessonToCourse[l.id] = l.modules.course_id
      if (l.modules.courses?.title) {
        courseTitles[l.modules.course_id] = l.modules.courses.title
      }
    }
  }

  const courseCompletions: Record<string, number> = {}
  for (const p of progressData ?? []) {
    const courseId = lessonToCourse[(p as { lesson_id: string }).lesson_id]
    if (courseId) {
      courseCompletions[courseId] = (courseCompletions[courseId] ?? 0) + 1
    }
  }

  const rankingCourses = Object.entries(courseCompletions)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([id, count]) => ({
      id,
      title: courseTitles[id] ?? 'Curso',
      count,
    }))

  const maxCompletions = Math.max(...rankingCourses.map((c) => c.count), 1)

  return (
    <>
      <style>{`
        .chart{ display:flex; align-items:flex-end; gap:10px; height:220px; padding-top:10px; }
        .chart .bar{ flex:1; background:linear-gradient(180deg,var(--blue),#7bbcff); border-radius:6px 6px 0 0; min-height:6px; position:relative; }
        .chart .bar span{ position:absolute; top:-22px; left:0; right:0; text-align:center; font-size:11px; font-weight:600; color:var(--ink-2); }
        .hbar{ display:flex; align-items:center; gap:14px; margin-bottom:14px; font-size:13.5px; }
        .hbar .nm{ width:180px; flex:none; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .hbar .tr{ flex:1; height:14px; background:#eef0f3; border-radius:980px; overflow:hidden; }
        .hbar .tr span{ display:block; height:100%; background:linear-gradient(90deg,var(--blue),var(--blue-600,#2a88e8)); }
        .donut{ width:180px; height:180px; border-radius:50%; flex:none; display:grid; place-items:center; }
        .donut .hole{ width:108px; height:108px; background:#fff; border-radius:50%; display:grid; place-items:center; text-align:center; }
        .leg{ display:flex; align-items:center; gap:9px; font-size:13.5px; padding:6px 0; }
        .leg .sw{ width:11px; height:11px; border-radius:3px; flex:none; }
        .sel-period{ padding:9px 14px; border-radius:980px; border:1px solid var(--line-2); background:#fff; font-size:13.5px; font-family:inherit; }
        @media (max-width:900px){ .g3{ grid-template-columns:1fr; } }
      `}</style>

      <div className="topbar">
        <div className="crumb">
          <a href="/admin">Admin</a> <span>›</span> <b>Relatórios</b>
        </div>
        <div className="avatar sm" style={{ background: 'var(--ink)' }}>FB</div>
      </div>

      <div className="content wide">
        <div className="flex between aic">
          <h1 style={{ fontSize: '26px' }}>Relatórios</h1>
          <div className="flex gap8 aic">
            <RelatoriosPeriodSelector value={period} />
            <button className="btn btn-ghost btn-sm" disabled title="Disponível em breve">
              Exportar
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid g3" style={{ marginTop: '20px' }}>
          <div className="stat">
            <div className="lbl">Receita total (estimada)</div>
            <div className="num">{formatCurrency(totalRevenue)}</div>
            <div className="delta up">período selecionado</div>
          </div>
          <div className="stat">
            <div className="lbl">Ticket médio</div>
            <div className="num">{formatCurrency(ticketMedio)}</div>
            <div className="delta up">assinaturas ativas</div>
          </div>
          <div className="stat">
            <div className="lbl">Churn mensal</div>
            <div className="num">{churnRate}%</div>
            <div className="delta">cancelamentos / mês</div>
          </div>
        </div>

        {/* Gráfico receita por mês */}
        <div className="card card-pad" style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '17px', marginBottom: '6px' }}>
            Receita estimada por mês
          </h3>
          <div className="chart">
            {revenueBarHeights.map((h, i) => (
              <div
                key={i}
                className="bar"
                style={{ height: `${h}%` }}
                title={`${monthLabels[i]}: ${formatCurrency(monthlyValues[i])}`}
              >
                {monthlyValues[i] > 0 && (
                  <span>{formatCurrency(monthlyValues[i])}</span>
                )}
              </div>
            ))}
          </div>
          <div
            className="flex between"
            style={{
              fontSize: '12px',
              color: 'var(--faint)',
              marginTop: '8px',
            }}
          >
            <span>{monthLabels[0]}</span>
            <span>{monthLabels[Math.floor(monthLabels.length / 2)]}</span>
            <span>{monthLabels[monthLabels.length - 1]}</span>
          </div>
        </div>

        <div
          className="grid"
          style={{ gridTemplateColumns: '1.4fr 1fr', marginTop: '24px', gap: '24px' }}
        >
          {/* Ranking de cursos */}
          <div className="card card-pad">
            <h3 style={{ fontSize: '17px', marginBottom: '18px' }}>
              Aulas concluídas por curso
            </h3>
            {rankingCourses.length === 0 && (
              <p className="muted" style={{ fontSize: '13px' }}>
                Sem dados de progresso ainda.
              </p>
            )}
            {rankingCourses.map((c) => (
              <div key={c.id} className="hbar">
                <span className="nm" title={c.title}>
                  {c.title}
                </span>
                <div className="tr">
                  <span
                    style={{
                      width: `${Math.round((c.count / maxCompletions) * 100)}%`,
                    }}
                  />
                </div>
                <b>{Math.round((c.count / maxCompletions) * 100)}%</b>
              </div>
            ))}
          </div>

          {/* Donut planos */}
          <div className="card card-pad">
            <h3 style={{ fontSize: '17px', marginBottom: '18px' }}>
              Alunos por plano
            </h3>
            <div className="flex" style={{ gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div
                className="donut"
                style={{ background: donutGradient }}
              >
                <div className="hole">
                  <div>
                    <div style={{ fontSize: '22px', fontWeight: 600 }}>
                      {totalUsers.toLocaleString('pt-BR')}
                    </div>
                    <div className="muted" style={{ fontSize: '11px' }}>
                      total
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                {(['free', 'prata', 'ouro', 'diamante'] as const).map((plan) => (
                  <div key={plan} className="leg">
                    <div
                      className="sw"
                      style={{ background: PLAN_COLORS[plan] }}
                    />
                    <span>{PLAN_LABELS[plan]}</span>
                    <span
                      className="muted"
                      style={{ marginLeft: 'auto', fontWeight: 600 }}
                    >
                      {totalUsers > 0 ? Math.round(((planDist[plan] ?? 0) / totalUsers) * 100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
