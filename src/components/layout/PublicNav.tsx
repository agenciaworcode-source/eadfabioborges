import Link from 'next/link'
import Image from 'next/image'
import { CartBadge } from './CartBadge'

export function PublicNav() {
  return (
    <nav className="pubnav">
      <div className="wrap">
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
            <span>Mentoria Profissional em Estética</span>
          </span>
        </Link>
        <div className="links">
          <Link href="/">Início</Link>
          <Link href="/cursos">Cursos</Link>
          <Link href="/planos">Planos</Link>
        </div>
        <div className="flex aic gap12">
          <CartBadge />
          <Link className="btn btn-ghost btn-sm" href="/auth/login">
            Entrar
          </Link>
          <Link className="btn btn-primary btn-sm pubnav-cta" href="/auth/cadastro">
            Começar agora
          </Link>
        </div>
      </div>
    </nav>
  )
}
