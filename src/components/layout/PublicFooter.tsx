import Link from 'next/link'
import Image from 'next/image'

export function PublicFooter() {
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="cols">
          <div>
            <Link className="logo" href="/">
              <Image src="/mb-logo.png" alt="MB" width={30} height={30} style={{ height: '30px', width: 'auto' }} />
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
            <Link href="#">Suporte</Link>
          </div>
          <div>
            <h4>Contato</h4>
            <Link href="#">Instagram</Link>
            <Link href="#">WhatsApp</Link>
            <Link href="#">contato@fabioborges.com.br</Link>
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
