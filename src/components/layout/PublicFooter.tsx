import Link from 'next/link'
import Image from 'next/image'

export function PublicFooter() {
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="cols">
          <div>
            <Link className="logo" href="/">
              <Image
                src="/mb-logo.png"
                alt="MB"
                width={30}
                height={30}
                style={{ height: '30px', width: 'auto' }}
              />
              <span className="lk">
                <b>Fábio Borges</b>
                <span>Mentoria</span>
              </span>
            </Link>
            <p className="muted" style={{ fontSize: '14px', marginTop: '16px', maxWidth: '34ch' }}>
              Especialização em recursos eletrotermoterapêuticos e estética avançada.
            </p>
          </div>
          <div>
            <h4>Plataforma</h4>
            <Link href="/cursos">Cursos</Link>
            <Link href="/planos">Planos</Link>
            <Link href="/auth/login">Entrar</Link>
            <Link href="/auth/cadastro">Criar conta</Link>
          </div>
          <div>
            <h4>Recursos</h4>
            <Link href="#">Verificar certificado</Link>
            <Link href="#">Blog</Link>
            <Link href="/planos">Planos de mentoria</Link>
          </div>
          <div>
            <h4>Contato</h4>
            <a href="https://wa.me/5521997022329" target="_blank" rel="noopener noreferrer">
              WhatsApp: (21) 99702-2329
            </a>
            <a href="mailto:mentoriafabioborges@gmail.com">mentoriafabioborges@gmail.com</a>
            <span className="muted" style={{ fontSize: '13px' }}>
              Seg. a Sex.: 09h às 18h
            </span>
            <span className="muted" style={{ fontSize: '13px' }}>
              Sábado: 09h às 12h
            </span>
          </div>
        </div>
        <div className="bottom">
          <span>© 2026 Fábio Borges Mentoria. Todos os direitos reservados.</span>
          <span>Termos · Privacidade</span>
        </div>
      </div>
    </footer>
  )
}
