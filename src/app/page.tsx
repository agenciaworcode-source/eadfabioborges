// ISR: homepage com dados de planos — revalida a cada 5 min
export const revalidate = 300

import Link from 'next/link'
import { PublicNav } from '@/components/layout/PublicNav'
import { PublicFooter } from '@/components/layout/PublicFooter'
import { createClient } from '@/lib/supabase/server'

interface PlanPrice {
  id: string
  price_monthly: number
}

function fmtPrice(cents: number): string {
  if (!cents) return 'Sob consulta'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}

const checkSvg = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

export default async function HomePage() {
  const supabase = createClient()
  const { data: plansData } = await supabase
    .from('plans')
    .select('id, price_monthly')
    .in('id', ['prata', 'ouro', 'diamante'])
    .eq('is_active', true)
  const priceMap = Object.fromEntries(
    ((plansData ?? []) as PlanPrice[]).map((p) => [p.id, p.price_monthly])
  ) as Record<string, number>

  return (
    <>
      <style>{`
        .hero{ padding:64px 0 30px; }
        .hero-grid{ display:grid; grid-template-columns:1.05fr .95fr; gap:48px; align-items:center; }
        .hero h1{ margin-bottom:20px; }
        .hero p.lead{ font-size:19px; color:var(--ink-2); max-width:30ch; }
        .hero-cta{ display:flex; gap:12px; margin-top:30px; flex-wrap:wrap; }
        .hero-stats{ display:flex; gap:24px 34px; margin-top:38px; flex-wrap:wrap; }
        .hero-stats .n{ font-size:28px; font-weight:600; letter-spacing:-.03em; }
        .hero-stats .l{ font-size:13px; color:var(--muted); }
        .portrait{
          position:relative; aspect-ratio:4/5; border-radius:var(--r-xl); overflow:hidden;
          background:linear-gradient(160deg,#cfe2ff,#9bc4ff 40%,#48a1fe);
          box-shadow:var(--shadow-lg);
        }
        .portrait .ph{ position:absolute; inset:0; display:grid; place-items:center; color:rgba(255,255,255,.9); font-weight:600; }
        .portrait .float{
          position:absolute; left:22px; bottom:22px; right:22px; background:rgba(255,255,255,.92);
          backdrop-filter:blur(10px); border-radius:var(--r); padding:14px 16px; display:flex; align-items:center; gap:12px;
          box-shadow:var(--shadow);
        }
        .marquee{ border-top:1px solid var(--line); border-bottom:1px solid var(--line); padding:22px 0; margin-top:30px; background:#fff; }
        .marquee .row{ display:flex; justify-content:space-between; align-items:center; gap:12px 24px; opacity:.6; font-weight:600; color:var(--muted); flex-wrap:wrap; }
        .section{ padding:78px 0; }
        .section h2{ margin-bottom:14px; }
        .sec-head{ max-width:62ch; }
        .benefits{ display:grid; grid-template-columns:repeat(3,1fr); gap:24px; margin-top:46px; }
        .benefit{ background:#fff; border:1px solid var(--line); border-radius:var(--r-lg); padding:30px; }
        .benefit .ic{ width:48px; height:48px; border-radius:13px; background:var(--blue-tint); color:var(--blue-600); display:grid; place-items:center; margin-bottom:18px; }
        .benefit h3{ font-size:19px; margin-bottom:8px; }
        .benefit p{ font-size:14.5px; color:var(--muted); }
        .courses{ display:grid; grid-template-columns:repeat(3,1fr); gap:24px; margin-top:42px; }
        .ccard{ background:#fff; border:1px solid var(--line); border-radius:var(--r-lg); overflow:hidden; box-shadow:var(--shadow-xs); transition:transform .18s, box-shadow .18s; }
        .ccard:hover{ transform:translateY(-4px); box-shadow:var(--shadow); }
        .ccard .body{ padding:18px; }
        .ccard .meta{ display:flex; gap:10px; font-size:12.5px; color:var(--muted); margin-bottom:9px; }
        .ccard h3{ font-size:17px; line-height:1.2; }
        .ccard .foot{ display:flex; align-items:center; justify-content:space-between; margin-top:16px; }
        .testi{ display:grid; grid-template-columns:repeat(3,1fr); gap:24px; margin-top:46px; }
        .tcard{ background:#fff; border:1px solid var(--line); border-radius:var(--r-lg); padding:28px; }
        .tcard .stars{ color:var(--blue); font-size:15px; letter-spacing:2px; }
        .tcard p{ font-size:15.5px; color:var(--ink-2); margin:14px 0 20px; line-height:1.55; }
        .tcard .who{ display:flex; align-items:center; gap:12px; }
        .plans{ display:grid; grid-template-columns:repeat(4,1fr); gap:18px; margin-top:46px; align-items:start; }
        .pcard{ background:#fff; border:1px solid var(--line); border-radius:var(--r-lg); padding:26px 22px; }
        .pcard.feat{ border:1.5px solid var(--blue); box-shadow:var(--shadow-blue); position:relative; }
        .pcard.feat .ribbon{ position:absolute; top:-12px; left:50%; transform:translateX(-50%); background:var(--blue); color:#fff; font-size:11px; font-weight:600; padding:5px 13px; border-radius:980px; }
        .pcard .pn{ font-size:15px; font-weight:600; }
        .pcard .pp{ font-size:34px; font-weight:600; letter-spacing:-.03em; margin:10px 0 2px; }
        .pcard .pp small{ font-size:14px; color:var(--muted); font-weight:500; }
        .pcard ul{ list-style:none; padding:0; margin:18px 0 22px; display:flex; flex-direction:column; gap:10px; }
        .pcard li{ font-size:13.5px; color:var(--ink-2); display:flex; gap:9px; align-items:flex-start; }
        .pcard li svg{ color:var(--blue-600); flex:none; margin-top:1px; }
        .cta-band{ background:var(--ink); color:#fff; border-radius:var(--r-xl); padding:56px; text-align:center; margin:0 auto; }
        .cta-band h2{ color:#fff; }
        @media (max-width:900px){
          .hero-grid{ grid-template-columns:1fr; } .portrait{ max-width:420px; }
          .benefits,.courses,.testi{ grid-template-columns:1fr; }
          .plans{ grid-template-columns:1fr 1fr; }
        }
        @media (max-width:600px){
          .plans{ grid-template-columns:1fr; }
          .cta-band{ padding:36px 24px; border-radius:var(--r-lg); }
          .hero{ padding:40px 0 20px; }
        }
      `}</style>

      <PublicNav />

      <header className="hero">
        <div className="wrap hero-grid">
          <div>
            <span className="badge blue dot" style={{ marginBottom: '22px' }}>
              Mentoria especializada em recursos eletrotermoterapêuticos
            </span>
            <h1>
              Eleve a sua
              <br />
              estética a nível
              <br />
              <span style={{ color: 'var(--blue-600)' }}>profissional.</span>
            </h1>
            <p className="lead">
              Cursos práticos de estética avançada, micropigmentação e gestão — guiados pela
              metodologia Fábio Borges.
            </p>
            <div className="hero-cta">
              <Link className="btn btn-primary btn-lg" href="/auth/cadastro">
                Comece agora
              </Link>
              <Link className="btn btn-ghost btn-lg" href="/cursos">
                Ver cursos
              </Link>
            </div>
            <div className="hero-stats">
              <div>
                <div className="n">12.000+</div>
                <div className="l">alunas formadas</div>
              </div>
              <div>
                <div className="n">4,9★</div>
                <div className="l">avaliação média</div>
              </div>
              <div>
                <div className="n">6</div>
                <div className="l">trilhas completas</div>
              </div>
            </div>
          </div>
          <div className="portrait">
            <div className="ph">Foto — Fábio Borges</div>
            <div className="float">
              <div className="avatar" style={{ background: '#1d1d1f' }}>
                FB
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>Fábio Borges</div>
                <div style={{ fontSize: '12px' }} className="muted">
                  Mentor · 15 anos de clínica
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="marquee">
        <div className="wrap">
          <div className="row">
            <span>Eletroterapia</span>
            <span>Skincare</span>
            <span>Micropigmentação</span>
            <span>Maquiagem</span>
            <span>Sobrancelhas</span>
            <span>Gestão</span>
          </div>
        </div>
      </div>

      {/* BENEFITS */}
      <section className="section">
        <div className="wrap">
          <div className="sec-head center" style={{ margin: '0 auto' }}>
            <span className="eyebrow">Por que a mentoria</span>
            <h2 style={{ marginTop: '12px' }}>Tudo o que você precisa para se tornar referência</h2>
          </div>
          <div className="benefits">
            <div className="benefit">
              <div className="ic">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.5 2.5M16.5 16.5L19 19M19 5l-2.5 2.5M7.5 16.5L5 19" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <h3>Conteúdo prático e real</h3>
              <p>
                Protocolos testados em clínica, do básico ao avançado — sem teoria que não se aplica
                no dia a dia.
              </p>
            </div>
            <div className="benefit">
              <div className="ic">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c0 1 2.5 3 6 3s6-2 6-3v-5" />
                </svg>
              </div>
              <h3>Certificação reconhecida</h3>
              <p>
                Certificado digital verificável a cada trilha concluída — para comprovar a sua
                especialização.
              </p>
            </div>
            <div className="benefit">
              <div className="ic">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3>Mentoria ao vivo</h3>
              <p>
                Encontros mensais com o Fábio e a comunidade para tirar dúvidas e evoluir junto.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* COURSES */}
      <section className="section" style={{ paddingTop: '0' }}>
        <div className="wrap">
          <div className="flex between aic">
            <div>
              <span className="eyebrow">Catálogo</span>
              <h2 style={{ marginTop: '12px' }}>Cursos em destaque</h2>
            </div>
            <Link className="btn btn-ghost" href="/cursos">
              Ver todos
            </Link>
          </div>
          <div className="courses">
            <Link className="ccard" href="/cursos/eletroterapia-recursos-esteticos">
              <div className="thumb b2">
                <svg
                  className="cat-icn"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M13 2 3 14h7l-1 8 10-12h-7z" />
                </svg>
              </div>
              <div className="body">
                <div className="meta">
                  <span>Intermediário</span>·<span>16h</span>
                </div>
                <h3>Eletroterapia &amp; Recursos Estéticos</h3>
                <div className="foot">
                  <span className="price">R$ 397</span>
                  <span className="badge blue">Incluído no Ouro</span>
                </div>
              </div>
            </Link>
            <Link className="ccard" href="/cursos/skincare-avancado">
              <div className="thumb">
                <svg
                  className="cat-icn"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M12 2s7 7 7 12a7 7 0 1 1-14 0c0-5 7-12 7-12z" />
                </svg>
              </div>
              <div className="body">
                <div className="meta">
                  <span>Avançado</span>·<span>14h</span>
                </div>
                <h3>Skincare Avançado &amp; Protocolos</h3>
                <div className="foot">
                  <span className="price">R$ 397</span>
                  <span className="badge blue">Incluído no Ouro</span>
                </div>
              </div>
            </Link>
            <Link className="ccard" href="/cursos/micropigmentacao">
              <div className="thumb b4">
                <svg
                  className="cat-icn"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="m12 19 7-7 3 3-7 7-3-3z" />
                  <path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18z" />
                  <path d="m2 2 7.586 7.586" />
                  <circle cx="11" cy="11" r="2" />
                </svg>
              </div>
              <div className="body">
                <div className="meta">
                  <span>Avançado</span>·<span>22h</span>
                </div>
                <h3>Micropigmentação: Iniciante ao Avançado</h3>
                <div className="foot">
                  <span className="price">R$ 497</span>
                  <span className="badge">Avulso</span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section
        className="section"
        style={{
          background: '#fff',
          borderTop: '1px solid var(--line)',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <div className="wrap">
          <div className="center">
            <span className="eyebrow">Depoimentos</span>
            <h2 style={{ marginTop: '12px' }}>Resultados de quem fez</h2>
          </div>
          <div className="testi">
            <div className="tcard">
              <div className="stars">★★★★★</div>
              <p>
                &ldquo;Em 3 meses eu dobrei o faturamento da minha clínica. Os protocolos de
                eletroterapia mudaram a forma como atendo.&rdquo;
              </p>
              <div className="who">
                <div className="avatar sm">CM</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>Carla Mendes</div>
                  <div className="muted" style={{ fontSize: '12px' }}>
                    Esteticista · Campinas
                  </div>
                </div>
              </div>
            </div>
            <div className="tcard">
              <div className="stars">★★★★★</div>
              <p>
                &ldquo;A trilha de micropigmentação é absurda de completa. Saí insegura e hoje tenho
                agenda lotada e lista de espera.&rdquo;
              </p>
              <div className="who">
                <div className="avatar sm" style={{ background: '#1d1d1f' }}>
                  RA
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>Renata Alves</div>
                  <div className="muted" style={{ fontSize: '12px' }}>
                    Micropigmentadora · Recife
                  </div>
                </div>
              </div>
            </div>
            <div className="tcard">
              <div className="stars">★★★★★</div>
              <p>
                &ldquo;O módulo de gestão me deu o que faltava: precificação, fluxo e marca. Virei
                dona de negócio, não só técnica.&rdquo;
              </p>
              <div className="who">
                <div className="avatar sm" style={{ background: '#2bbf6a' }}>
                  JS
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>Juliana Souza</div>
                  <div className="muted" style={{ fontSize: '12px' }}>
                    Proprietária · Curitiba
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PLANS */}
      <section className="section">
        <div className="wrap">
          <div className="center">
            <span className="eyebrow">Planos</span>
            <h2 style={{ marginTop: '12px' }}>Escolha como quer evoluir</h2>
          </div>
          <div className="plans">
            <div className="pcard">
              <span className="plan-badge plan-free">Free</span>
              <div className="pp">Grátis</div>
              <p className="muted" style={{ fontSize: '13.5px' }}>
                Estudantes e visitantes
              </p>
              <ul>
                <li>{checkSvg}Acesso a cursos gratuitos</li>
                <li>{checkSvg}Prévia de módulos pagos</li>
              </ul>
              <Link className="btn btn-ghost btn-block" href="/auth/cadastro">
                Criar conta
              </Link>
            </div>
            <div className="pcard">
              <span className="plan-badge plan-prata">Prata</span>
              <div className="pp">
                {fmtPrice(priceMap['prata'] ?? 0)}
                <small>/mês</small>
              </div>
              <p className="muted" style={{ fontSize: '13.5px' }}>
                12x no cartão
              </p>
              <ul>
                <li>{checkSvg}Plataforma com vídeoaulas e palestras</li>
                <li>{checkSvg}Material digital (apostilas e artigos)</li>
                <li>{checkSvg}Certificado em cada trilha</li>
              </ul>
              <Link className="btn btn-ghost btn-block" href="/planos">
                Ver plano Prata
              </Link>
            </div>
            <div className="pcard feat">
              <span className="ribbon">Mais popular</span>
              <span className="plan-badge plan-ouro">Ouro</span>
              <div className="pp">
                {fmtPrice(priceMap['ouro'] ?? 0)}
                <small>/mês</small>
              </div>
              <p className="muted" style={{ fontSize: '13.5px' }}>
                12x no cartão
              </p>
              <ul>
                <li>{checkSvg}Tudo do Prata</li>
                <li>{checkSvg}Telefone exclusivo do mentor</li>
                <li>{checkSvg}E-mail exclusivo para dúvidas</li>
              </ul>
              <Link className="btn btn-primary btn-block" href="/planos">
                Ver plano Ouro
              </Link>
            </div>
            <div className="pcard">
              <span className="plan-badge plan-diamante">Diamante</span>
              <div className="pp">
                {fmtPrice(priceMap['diamante'] ?? 0)}
                <small>/mês</small>
              </div>
              <p className="muted" style={{ fontSize: '13.5px' }}>
                12x no cartão
              </p>
              <ul>
                <li>{checkSvg}Tudo do Ouro</li>
                <li>{checkSvg}Reunião particular a cada 60 dias</li>
                <li>{checkSvg}Selo &quot;Mentoria Fábio Borges&quot;</li>
              </ul>
              <Link className="btn btn-ghost btn-block" href="/planos">
                Ver plano Diamante
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA BAND */}
      <section className="wrap" style={{ paddingBottom: '20px' }}>
        <div className="cta-band">
          <h2>Pronta para se tornar referência?</h2>
          <p
            style={{
              color: 'rgba(255,255,255,.7)',
              fontSize: '18px',
              margin: '14px auto 28px',
              maxWidth: '46ch',
            }}
          >
            Comece grátis hoje e tenha acesso aos primeiros cursos da mentoria.
          </p>
          <Link className="btn btn-primary btn-lg" href="/auth/cadastro">
            Criar minha conta grátis
          </Link>
        </div>
      </section>

      <PublicFooter />
    </>
  )
}
