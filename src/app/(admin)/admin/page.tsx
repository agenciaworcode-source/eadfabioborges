import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { PLAN_LABELS, PLAN_COLORS } from '@/config/plans'

interface SubRow {
  id: string
  plan: string
  status: string
  period_start: string
  users: { name: string; email: string } | null
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default async function AdminPage() {
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

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const startOfLastMonth = new Date(startOfMonth)
  startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1)

  // Stats: total alunos + delta
  const { count: totalAlunos } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .neq('role', 'admin')

  const { count: newAlunosThisMonth } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .neq('role', 'admin')
    .gte('created_at', startOfMonth.toISOString())

  // Stats: total certificados + delta
  const { count: totalCertificados } = await supabase
    .from('certificates')
    .select('*', { count: 'exact', head: true })

  const { count: newCertsThisMonth } = await supabase
    .from('certificates')
    .select('*', { count: 'exact', head: true })
    .gte('issued_at', startOfMonth.toISOString())

  // Stats: taxa de conclusão
  const { count: completedEnrollments } = await supabase
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed')

  const { count: totalEnrollments } = await supabase
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .in('status', ['active', 'completed'])

  const taxaConclusao =
    totalEnrollments && totalEnrollments > 0
      ? Math.round(((completedEnrollments ?? 0) / totalEnrollments) * 100)
      : 0

  // Stats: receita do mês
  const { data: monthlySubsData } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('status', 'active')
    .gte('period_start', startOfMonth.toISOString())

  const monthlyRevenue = (monthlySubsData ?? []).reduce(
    (sum, s: { plan: string }) =>
      sum + (planPrices[(s.plan ?? '').toLowerCase()] ?? 0),
    0
  )

  // Badge % crescimento de matrículas (mês atual vs anterior)
  const { count: enrollsThisMonth } = await supabase
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .gte('enrolled_at', startOfMonth.toISOString())

  const { count: enrollsLastMonth } = await supabase
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .gte('enrolled_at', startOfLastMonth.toISOString())
    .lt('enrolled_at', startOfMonth.toISOString())

  const enrollGrowth =
    enrollsLastMonth && enrollsLastMonth > 0
      ? Math.round(
          (((enrollsThisMonth ?? 0) - enrollsLastMonth) / enrollsLastMonth) * 100
        )
      : null

  // Gráfico: matrículas por dia nos últimos 30 dias
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: enrollmentsData } = await supabase
    .from('enrollments')
    .select('enrolled_at')
    .gte('enrolled_at', thirtyDaysAgo.toISOString())

  const dayMap: Record<string, number> = {}
  for (let i = 0; i < 30; i++) {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    const key = d.toISOString().slice(0, 10)
    dayMap[key] = 0
  }
  for (const e of enrollmentsData ?? []) {
    const key = ((e as unknown as { enrolled_at: string }).enrolled_at).slice(0, 10)
    if (key in dayMap) dayMap[key]++
  }

  const dayCounts = Object.values(dayMap)
  const maxCount = Math.max(...dayCounts, 1)
  const chartBars = dayCounts.map((c, i) => ({
    height: Math.max(4, Math.round((c / maxCount) * 100)),
    isPeak: i === dayCounts.length - 1 || c === maxCount,
  }))

  // Distribuição por plano
  const { data: planDistData } = await supabase
    .from('users')
    .select('plan')
    .neq('role', 'admin')

  const planDist: Record<string, number> = { free: 0, prata: 0, ouro: 0, diamante: 0 }
  for (const u of planDistData ?? []) {
    const p = ((u as { plan: string | null }).plan ?? 'free').toLowerCase()
    if (p in planDist) planDist[p]++
  }
  const maxPlanCount = Math.max(...Object.values(planDist), 1)

  // Últimas 5 assinaturas
  const { data: recentSubsData } = await supabase
    .from('subscriptions')
    .select('id, plan, status, period_start, users(name, email)')
    .order('period_start', { ascending: false })
    .limit(5)

  const recentSubs = (recentSubsData ?? []) as unknown as SubRow[]

  return (
    <>
      <style>{`
        .chart{ display:flex; align-items:flex-end; gap:8px; height:200px; padding-top:10px; }
        .chart .bar{ flex:1; background:linear-gradient(180deg,var(--blue),#7bbcff); border-radius:6px 6px 0 0; min-height:6px; transition:opacity .15s; }
        .chart .bar:hover{ opacity:.8; }
        .chart .bar.peak{ background:linear-gradient(180deg,var(--blue-600,#2a88e8),var(--blue)); }
        @media (max-width:900px){ .g4{ grid-template-columns:1fr 1fr; } }
      `}</style>

      <div className="topbar">
        <div className="crumb">
          <b>Painel administrativo</b>
        </div>
        <div className="flex aic gap16">
          <span className="muted" style={{ fontSize: '13px' }}>
            {new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date())}
          </span>
          <div className="avatar sm" style={{ background: 'var(--ink)' }}>FB</div>
        </div>
      </div>

      <div className="content wide">
        <h1 style={{ fontSize: '26px' }}>Visão geral</h1>

        {/* Stat cards */}
        <div className="grid g4" style={{ marginTop: '20px' }}>
          <div className="stat">
            <div className="lbl">Total de alunos</div>
            <div className="num">{(totalAlunos ?? 0).toLocaleString('pt-BR')}</div>
            {(newAlunosThisMonth ?? 0) > 0 && (
              <div className="delta up">+{newAlunosThisMonth} este mês</div>
            )}
          </div>
          <div className="stat">
            <div className="lbl">Receita (mês)</div>
            <div className="num">{formatCurrency(monthlyRevenue)}</div>
          </div>
          <div className="stat">
            <div className="lbl">Taxa de conclusão</div>
            <div className="num">{taxaConclusao}%</div>
          </div>
          <div className="stat">
            <div className="lbl">Certificados emitidos</div>
            <div className="num">{(totalCertificados ?? 0).toLocaleString('pt-BR')}</div>
            {(newCertsThisMonth ?? 0) > 0 && (
              <div className="delta up">+{newCertsThisMonth} este mês</div>
            )}
          </div>
        </div>

        {/* Grid 2 colunas: gráfico + alunos por plano */}
        <div
          className="grid"
          style={{ gridTemplateColumns: '1.5fr 1fr', marginTop: '24px', gap: '24px' }}
        >
          <div className="card card-pad">
            <div className="flex between aic">
              <div>
                <h3 style={{ fontSize: '17px' }}>Novas matrículas</h3>
                <p className="muted" style={{ fontSize: '13px' }}>
                  Últimos 30 dias
                </p>
              </div>
              {enrollGrowth !== null && (
                <span className={`badge dot ${enrollGrowth >= 0 ? 'green' : ''}`}>
                  {enrollGrowth >= 0 ? '+' : ''}
                  {enrollGrowth}%
                </span>
              )}
            </div>
            <div className="chart" style={{ marginTop: '16px' }}>
              {chartBars.map((bar, i) => (
                <div
                  key={i}
                  className={`bar${bar.isPeak ? ' peak' : ''}`}
                  style={{ height: `${bar.height}%` }}
                />
              ))}
            </div>
            <div
              className="flex between"
              style={{ fontSize: '12px', color: 'var(--faint)', marginTop: '8px' }}
            >
              <span>-30 dias</span>
              <span>-15 dias</span>
              <span>Hoje</span>
            </div>
          </div>

          {/* Alunos por plano */}
          <div className="card card-pad">
            <h3 style={{ fontSize: '17px' }}>Alunos por plano</h3>
            <div className="col gap16" style={{ marginTop: '18px' }}>
              {(['free', 'prata', 'ouro', 'diamante'] as const).map((plan) => (
                <div key={plan}>
                  <div
                    className="flex between"
                    style={{ fontSize: '13.5px', marginBottom: '6px' }}
                  >
                    <span>{PLAN_LABELS[plan]}</span>
                    <b>{planDist[plan]}</b>
                  </div>
                  <div className="progress">
                    <span
                      style={{
                        width: `${Math.round((planDist[plan] / maxPlanCount) * 100)}%`,
                        background: PLAN_COLORS[plan],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabela últimas assinaturas */}
        <div className="card" style={{ marginTop: '24px' }}>
          <div
            className="flex between aic"
            style={{ padding: '20px 22px 14px' }}
          >
            <h3 style={{ fontSize: '17px' }}>Últimos pagamentos</h3>
            <Link
              href="/admin/relatorios"
              className="blue"
              style={{ fontSize: '13.5px', fontWeight: 600 }}
            >
              Ver relatórios →
            </Link>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Plano / Curso</th>
                <th>Valor</th>
                <th>Data</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentSubs.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="muted"
                    style={{ textAlign: 'center', padding: '20px' }}
                  >
                    Nenhuma assinatura encontrada
                  </td>
                </tr>
              )}
              {recentSubs.map((sub) => {
                const name = sub.users?.name ?? 'Aluno'
                const plan = (sub.plan ?? 'free').toLowerCase()
                const price = planPrices[plan] ?? 0
                const isActive = sub.status === 'active'
                return (
                  <tr key={sub.id}>
                    <td>
                      <div className="flex aic gap12">
                        <div className="avatar sm">{initials(name)}</div>
                        {name}
                      </div>
                    </td>
                    <td>Plano {PLAN_LABELS[plan] ?? sub.plan}</td>
                    <td>{formatCurrency(price)}</td>
                    <td>{formatDateTime(sub.period_start)}</td>
                    <td>
                      {isActive ? (
                        <span className="badge green dot">Aprovado</span>
                      ) : (
                        <span
                          className="badge"
                          style={{ background: '#fdeede', color: '#b5790f' }}
                        >
                          {sub.status}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
