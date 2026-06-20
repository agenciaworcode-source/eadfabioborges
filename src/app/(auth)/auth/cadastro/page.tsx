'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'

const cadastroSchema = z
  .object({
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    email: z.string().email('E-mail inválido'),
    password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
    confirmPassword: z.string(),
    terms: z.boolean().refine((v) => v === true, 'Aceite os termos para continuar'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

type CadastroForm = z.infer<typeof cadastroSchema>

const checkSvg = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

// checkSvg definido uma única vez antes do componente
export default function CadastroPage() {
  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CadastroForm>({ resolver: zodResolver(cadastroSchema) })

  async function onSubmit(data: CadastroForm) {
    setServerError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.name },
      },
    })
    if (error) {
      setServerError(error.message)
      return
    }
    setSuccess(true)
  }

  async function handleGoogleSignup() {
    setGoogleLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  if (success) {
    return (
      <>
        <style>{`
          .auth{ min-height:100vh; display:grid; grid-template-columns:1fr 1fr; }
          .auth-side{ background:var(--ink); color:#fff; padding:54px; display:flex; flex-direction:column; justify-content:space-between; position:relative; overflow:hidden; }
          .auth-form{ display:flex; align-items:center; justify-content:center; padding:40px; }
          .auth-card{ width:100%; max-width:410px; }
          @media (max-width:820px){ .auth{ grid-template-columns:1fr; } .auth-side{ display:none; } }
        `}</style>
        <div className="auth">
          <AuthSide />
          <div className="auth-form">
            <div className="auth-card" style={{ textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--green-tint)', display: 'grid', placeItems: 'center', margin: '0 auto 24px' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <h1 style={{ fontSize: '30px' }}>Quase lá!</h1>
              <p className="muted" style={{ margin: '10px 0 24px' }}>
                Enviamos um e-mail de confirmação. Verifique sua caixa de entrada para ativar sua conta.
              </p>
              <Link href="/auth/login" className="btn btn-primary btn-block">
                Ir para o login
              </Link>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{`
        .auth{ min-height:100vh; display:grid; grid-template-columns:1fr 1fr; }
        .auth-side{ background:var(--ink); color:#fff; padding:54px; display:flex; flex-direction:column; justify-content:space-between; position:relative; overflow:hidden; }
        .auth-form{ display:flex; align-items:center; justify-content:center; padding:40px; }
        .auth-card{ width:100%; max-width:410px; }
        .gbtn{ width:100%; display:flex; align-items:center; justify-content:center; gap:10px; padding:13px; border-radius:980px; border:1px solid var(--line-2); background:#fff; font-weight:600; font-size:15px; cursor:pointer; }
        .gbtn:hover{ background:var(--surface-2); }
        .sep{ display:flex; align-items:center; gap:14px; color:var(--faint); font-size:13px; margin:20px 0; }
        .sep::before,.sep::after{ content:""; flex:1; height:1px; background:var(--line); }
        .perk{ display:flex; gap:12px; align-items:center; margin-top:16px; color:rgba(255,255,255,.85); font-size:15px; }
        .perk .pk{ width:30px; height:30px; border-radius:9px; background:rgba(72,161,254,.2); color:var(--blue); display:grid; place-items:center; flex:none; }
        .z2{ position:relative; z-index:2; }
        .glow2{ position:absolute; width:360px; height:360px; border-radius:50%; background:radial-gradient(circle,rgba(72,161,254,.5),transparent 70%); filter:blur(20px); left:-80px; bottom:10%; }
        .gap16{ gap:16px; }
        @media (max-width:820px){ .auth{ grid-template-columns:1fr; } .auth-side{ display:none; } }
      `}</style>
      <div className="auth">
        <AuthSide />
        <div className="auth-form">
          <div className="auth-card">
            <h1 style={{ fontSize: '30px' }}>Criar conta</h1>
            <p className="muted" style={{ margin: '10px 0 26px' }}>Leva menos de um minuto.</p>

            <button onClick={handleGoogleSignup} disabled={googleLoading} className="gbtn">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
              </svg>
              {googleLoading ? 'Redirecionando...' : 'Cadastrar com Google'}
            </button>

            <div className="sep">ou com e-mail</div>

            <form className="col gap16" onSubmit={handleSubmit(onSubmit)}>
              <div className="field">
                <label htmlFor="name">Nome completo</label>
                <input id="name" {...register('name')} className="input" placeholder="Maria Silva" />
                {errors.name && <span style={{ color: '#d23b3b', fontSize: '13px' }}>{errors.name.message}</span>}
              </div>

              <div className="field">
                <label htmlFor="email">E-mail</label>
                <input id="email" {...register('email')} className="input" type="email" placeholder="voce@email.com" />
                {errors.email && <span style={{ color: '#d23b3b', fontSize: '13px' }}>{errors.email.message}</span>}
              </div>

              <div className="grid g2" style={{ gap: '14px' }}>
                <div className="field">
                  <label htmlFor="password">Senha</label>
                  <input id="password" {...register('password')} className="input" type="password" placeholder="••••••••" />
                  {errors.password && <span style={{ color: '#d23b3b', fontSize: '13px' }}>{errors.password.message}</span>}
                </div>
                <div className="field">
                  <label htmlFor="confirmPassword">Confirmar</label>
                  <input id="confirmPassword" {...register('confirmPassword')} className="input" type="password" placeholder="••••••••" />
                  {errors.confirmPassword && <span style={{ color: '#d23b3b', fontSize: '13px' }}>{errors.confirmPassword.message}</span>}
                </div>
              </div>

              <label className="flex aic gap12" style={{ fontSize: '13.5px', color: 'var(--ink-2)', cursor: 'pointer' }}>
                <input type="checkbox" {...register('terms')} style={{ width: '17px', height: '17px', accentColor: 'var(--blue)' }} />
                Concordo com os <Link href="#" className="blue">Termos</Link> e <Link href="#" className="blue">Privacidade</Link>.
              </label>
              {errors.terms && <span style={{ color: '#d23b3b', fontSize: '13px' }}>{errors.terms.message}</span>}

              {serverError && <p style={{ color: '#d23b3b', fontSize: '14px' }}>{serverError}</p>}

              <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-lg btn-block">
                {isSubmitting ? 'Criando conta...' : 'Criar minha conta'}
              </button>
            </form>

            <p className="muted center" style={{ marginTop: '22px', fontSize: '14px' }}>
              Já tem conta?{' '}
              <Link href="/auth/login" className="blue" style={{ fontWeight: 600 }}>
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

function AuthSide() {
  return (
    <div className="auth-side">
      <div className="glow2" />
      <Link className="logo z2" href="/" style={{ filter: 'brightness(0) invert(1)' }}>
        <Image src="/mb-logo.png" alt="MB" width={30} height={30} style={{ height: '30px', width: 'auto' }} />
        <span className="lk">
          <b style={{ color: '#fff' }}>Fábio Borges</b>
          <span style={{ color: 'rgba(255,255,255,.6)' }}>Mentoria Profissional em Estética</span>
        </span>
      </Link>
      <div className="z2">
        <h2 style={{ color: '#fff', fontSize: '30px', maxWidth: '18ch' }}>Comece grátis. Evolua sem limites.</h2>
        <div style={{ marginTop: '26px' }}>
          <div className="perk"><span className="pk">{checkSvg}</span>Acesso imediato a 2 cursos intro</div>
          <div className="perk"><span className="pk">{checkSvg}</span>Sem cartão de crédito</div>
          <div className="perk"><span className="pk">{checkSvg}</span>Certificado em cada trilha</div>
        </div>
      </div>
      <div className="z2" style={{ color: 'rgba(255,255,255,.45)', fontSize: '13px' }}>
        ★★★★★ 4,9 de avaliação média entre alunas.
      </div>
    </div>
  )
}
