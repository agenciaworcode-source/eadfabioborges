import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { PrintButton } from '@/components/shared/PrintButton'

interface PageProps {
  params: { uuid: string }
}

interface CertRow {
  id: string
  user_id: string
  course_id: string
  issued_at: string
  pdf_url: string | null
  verified: boolean
  users: { name: string } | null
  courses: { title: string; description: string | null } | null
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso))
}

export default async function CertificadoPublicoPage({ params }: PageProps) {
  const supabase = createClient()

  const { data: certData } = await supabase
    .from('certificates')
    .select('id, user_id, course_id, issued_at, pdf_url, verified, users(name), courses(title, description)')
    .eq('id', params.uuid)
    .maybeSingle()

  const cert = certData as unknown as CertRow | null

  if (!cert) notFound()

  const studentName = cert.users?.name ?? 'Aluno'
  const courseName = cert.courses?.title ?? 'Curso'
  const shortCode = `MB-${new Date(cert.issued_at).getFullYear()}-${cert.id.slice(0, 6).toUpperCase()}`

  return (
    <>
      <style>{`
        body{ background:radial-gradient(120% 70% at 50% 0%,#eaf4ff,#f2f2f2 55%); min-height:100vh; padding:40px 20px; }
        .vbar{ max-width:880px; margin:0 auto 20px; display:flex; justify-content:space-between; align-items:center; }
        .cert-doc{ max-width:880px; margin:0 auto; background:#fff; border-radius:var(--r-lg); box-shadow:var(--shadow-lg); overflow:hidden; }
        .cert-top{ background:linear-gradient(120deg,var(--ink),#23262e); color:#fff; padding:22px 36px; display:flex; justify-content:space-between; align-items:center; }
        .valid{ display:inline-flex; align-items:center; gap:8px; background:var(--green-tint); color:#178a4a; padding:7px 15px; border-radius:980px; font-weight:600; font-size:13.5px; }
        .cert-inner{ padding:48px 60px 40px; position:relative; }
        .cert-inner::before{ content:""; position:absolute; inset:18px; border:1.5px solid #e2ecfb; border-radius:14px; pointer-events:none; }
        .z{ position:relative; }
        .cert-eyebrow{ font-size:12px; letter-spacing:.18em; text-transform:uppercase; color:var(--faint); text-align:center; }
        .cert-name{ font-size:38px; font-weight:600; letter-spacing:-.03em; text-align:center; margin:18px 0 6px; }
        .cert-line{ text-align:center; color:var(--muted); font-size:15px; }
        .cert-course{ text-align:center; font-size:22px; font-weight:600; color:var(--blue-600); margin:6px 0 0; }
        .grid-info{ display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin:34px 0; }
        .ginfo{ text-align:center; padding:16px; border:1px solid var(--line); border-radius:var(--r); }
        .ginfo .l{ font-size:11px; text-transform:uppercase; letter-spacing:.06em; color:var(--faint); }
        .ginfo .v{ font-size:18px; font-weight:600; margin-top:5px; }
        .cert-foot{ display:flex; justify-content:space-between; align-items:flex-end; margin-top:30px; }
        .sign{ text-align:center; }
        .sign .ln{ font-size:26px; font-style:italic; color:var(--ink); border-bottom:1.5px solid var(--ink); padding:0 24px 4px; font-weight:500; }
        .sign small{ display:block; margin-top:8px; color:var(--muted); }
        .qr-placeholder{ width:96px; height:96px; border-radius:12px; background:repeating-conic-gradient(#000 0 25%,#fff 0 50%) 0 0/12px 12px,#fff; border:4px solid #fff; box-shadow:0 0 0 1px var(--line); }
        @media print{ .vbar{ display:none; } body{ background:#fff; padding:0; } .cert-doc{ box-shadow:none; } }
        @media (max-width:720px){ .cert-inner{ padding:32px 24px; } .cert-name{ font-size:28px; } .grid-info{ grid-template-columns:1fr; } .cert-foot{ flex-direction:column; gap:24px; align-items:center; } }
      `}</style>

      <div className="vbar">
        <Link className="logo" href="/">
          <Image src="/mb-logo.png" alt="MB" width={30} height={30} style={{ height: '30px', width: 'auto' }} />
          <span className="lk">
            <b>Fábio Borges</b>
            <span>Mentoria Profissional em Estética</span>
          </span>
        </Link>
        <PrintButton />
      </div>

      <div className="cert-doc">
        <div className="cert-top">
          <div className="logo" style={{ filter: 'brightness(0) invert(1)' }}>
            <Image src="/mb-logo.png" alt="MB" width={26} height={26} style={{ height: '26px', width: 'auto' }} />
            <span className="lk">
              <b style={{ color: '#fff' }}>Fábio Borges</b>
              <span style={{ color: 'rgba(255,255,255,.6)' }}>Mentoria Profissional em Estética</span>
            </span>
          </div>
          <span className="valid">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Certificado válido
          </span>
        </div>

        <div className="cert-inner">
          <div className="z">
            <div className="cert-eyebrow">Certificado de Conclusão</div>
            <p className="cert-line" style={{ marginTop: '24px' }}>Certificamos que</p>
            <div className="cert-name">{studentName}</div>
            <p className="cert-line">concluiu com aproveitamento o curso</p>
            <div className="cert-course">{courseName}</div>

            <div className="grid-info">
              <div className="ginfo">
                <div className="l">Emitido em</div>
                <div className="v" style={{ fontSize: '15px' }}>{formatDate(cert.issued_at)}</div>
              </div>
              <div className="ginfo">
                <div className="l">Código</div>
                <div className="v" style={{ fontSize: '13px', fontFamily: 'monospace' }}>{shortCode}</div>
              </div>
              <div className="ginfo">
                <div className="l">Status</div>
                <div className="v" style={{ fontSize: '14px', color: '#178a4a' }}>Verificado ✓</div>
              </div>
            </div>

            <div className="cert-foot">
              <div className="sign">
                <div className="ln">Fábio Borges</div>
                <small>Mentor · Fábio Borges Mentoria</small>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="qr-placeholder" />
                <small className="muted" style={{ fontSize: '11px', display: 'block', marginTop: '8px' }}>
                  Verificar autenticidade
                </small>
              </div>
            </div>

            <p className="center muted" style={{ fontSize: '12px', marginTop: '30px', letterSpacing: '.02em' }}>
              Código de verificação: <b style={{ color: 'var(--ink)' }}>{shortCode}</b> · fabioborgesoficial.com.br/certificado
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
