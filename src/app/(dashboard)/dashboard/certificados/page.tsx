import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CopyButton } from '@/components/shared/CopyButton'

interface CertRow {
  id: string
  course_id: string
  issued_at: string
  pdf_url: string | null
  courses: { title: string } | null
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

export default async function CertificadosPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: certsData } = await supabase
    .from('certificates')
    .select('id, course_id, issued_at, pdf_url, courses(title)')
    .eq('user_id', user.id)
    .order('issued_at', { ascending: false })

  const certs = (certsData ?? []) as unknown as CertRow[]

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://ead.fabioborgesoficial.com.br'

  return (
    <>
      <style>{`
        .cgrid{ display:grid; grid-template-columns:repeat(3,1fr); gap:22px; margin-top:22px; }
        .cert{ background:#fff; border:1px solid var(--line); border-radius:var(--r-lg); overflow:hidden; box-shadow:var(--shadow-xs); }
        .cert .preview{ aspect-ratio:1.414/1; background:linear-gradient(135deg,#fbfcff,#eef4ff); border-bottom:1px solid var(--line); padding:22px; display:flex; flex-direction:column; position:relative; }
        .cert .preview::before{ content:""; position:absolute; inset:10px; border:1.5px solid #d6e6ff; border-radius:8px; }
        .cert .z{ position:relative; }
        .cert .seal{ width:40px; height:40px; border-radius:50%; background:var(--blue); color:#fff; display:grid; place-items:center; margin-left:auto; }
        .cert .body{ padding:18px; }
        .cert h3{ font-size:15.5px; }
        .cert .actions{ display:flex; gap:8px; margin-top:14px; }
        .cert-empty{ border-style:dashed; box-shadow:none; background:var(--surface-2); }
        .empty-inner{ text-align:center; padding:40px 18px; }
        .empty-inner .ic{ width:60px; height:60px; border-radius:50%; background:var(--surface-2); border:1px solid var(--line); color:var(--faint); display:grid; place-items:center; margin:0 auto 16px; }
        @media (max-width:900px){ .cgrid{ grid-template-columns:1fr; } }
      `}</style>

      <div className="content wide">
        <div className="flex between aic">
          <div>
            <h1 style={{ fontSize: '28px' }}>Certificados</h1>
            <p className="muted" style={{ marginTop: '6px' }}>
              Seus certificados de conclusão verificáveis.
            </p>
          </div>
          {certs.length > 0 && (
            <span className="badge">{certs.length} emitido{certs.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {certs.length === 0 ? (
          <div className="card card-pad center" style={{ marginTop: '32px' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--surface-2)', color: 'var(--faint)', display: 'grid', placeItems: 'center', margin: '0 auto 18px' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="8" r="6" />
                <path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5" />
              </svg>
            </div>
            <h3 style={{ fontSize: '18px' }}>Nenhum certificado ainda</h3>
            <p className="muted" style={{ margin: '8px 0 20px', fontSize: '14.5px' }}>
              Conclua um curso para receber seu certificado de conclusão.
            </p>
            <Link href="/dashboard" className="btn btn-ghost btn-sm">
              Ver meus cursos
            </Link>
          </div>
        ) : (
          <div className="cgrid">
            {certs.map((cert) => (
              <div key={cert.id} className="cert">
                <div className="preview">
                  <div className="z seal">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <circle cx="12" cy="8" r="6" />
                      <path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5" />
                    </svg>
                  </div>
                  <div className="z" style={{ marginTop: 'auto' }}>
                    <div style={{ fontSize: '10px', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--faint)' }}>
                      Certificado de Conclusão
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '15px', marginTop: '4px', color: 'var(--ink)' }}>
                      {cert.courses?.title ?? 'Curso'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '6px' }}>
                      Fábio Borges · Mentoria
                    </div>
                  </div>
                </div>
                <div className="body">
                  <h3>{cert.courses?.title ?? 'Curso'}</h3>
                  <p className="muted" style={{ fontSize: '12.5px', marginTop: '4px' }}>
                    Concluído em {formatDate(cert.issued_at)}
                  </p>
                  <div className="actions">
                    {cert.pdf_url ? (
                      <a
                        href={cert.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1 }}
                      >
                        Baixar PDF
                      </a>
                    ) : (
                      <Link
                        href={`/certificado/${cert.id}`}
                        target="_blank"
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1 }}
                      >
                        Ver certificado
                      </Link>
                    )}
                    <CopyButton text={`${appUrl}/certificado/${cert.id}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
