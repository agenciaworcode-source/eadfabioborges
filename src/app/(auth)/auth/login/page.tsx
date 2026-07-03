'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

function LoginFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl') || '/dashboard'

  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const supabase = createClient()

  async function onSubmit(data: LoginForm) {
    setServerError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) {
      setServerError('E-mail ou senha inválidos')
      return
    }
    router.push(returnUrl)
    router.refresh()
  }

  return (
    <div className="auth-card">
      <h1>Bem-vinda de volta</h1>
      <p className="muted" style={{ margin: '10px 0 28px' }}>
        Entre para continuar a sua trilha.
      </p>

      <form className="col gap16" noValidate onSubmit={handleSubmit(onSubmit)}>
        <div className="field">
          <label htmlFor="email">E-mail</label>
          <div className="input-icn">
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-10 5L2 7" />
            </svg>
            <input
              id="email"
              {...register('email')}
              className="input"
              type="email"
              autoComplete="email"
              placeholder="voce@email.com"
            />
          </div>
          {errors.email && (
            <span style={{ color: '#d23b3b', fontSize: '13px' }}>{errors.email.message}</span>
          )}
        </div>

        <div className="field">
          <div className="flex between aic">
            <label htmlFor="password">Senha</label>
            <Link href="/auth/recuperar-senha" style={{ fontSize: '13px' }} className="blue">
              Esqueci minha senha
            </Link>
          </div>
          <div className="input-icn">
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <input
              id="password"
              {...register('password')}
              className="input"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>
          {errors.password && (
            <span style={{ color: '#d23b3b', fontSize: '13px' }}>{errors.password.message}</span>
          )}
        </div>

        {serverError && <p style={{ color: '#d23b3b', fontSize: '14px' }}>{serverError}</p>}

        <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-lg btn-block">
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="muted center" style={{ marginTop: '24px', fontSize: '14px' }}>
        Não tem conta?{' '}
        <Link href="/auth/cadastro" className="blue" style={{ fontWeight: 600 }}>
          Criar agora
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .auth{ min-height:100vh; display:grid; grid-template-columns:1fr 1fr; }
        .auth-side{ background:var(--ink); color:#fff; padding:54px; display:flex; flex-direction:column; justify-content:space-between; position:relative; overflow:hidden; }
        .auth-side .quote{ font-size:26px; font-weight:500; letter-spacing:-.02em; line-height:1.3; max-width:22ch; }
        .auth-side .glow{ position:absolute; width:340px; height:340px; border-radius:50%; background:radial-gradient(circle,rgba(72,161,254,.55),transparent 70%); filter:blur(20px); right:-60px; top:30%; }
        .auth-form{ display:flex; align-items:center; justify-content:center; padding:40px; }
        .auth-card{ width:100%; max-width:400px; }
        .auth-card h1{ font-size:30px; }
        .gbtn{ width:100%; display:flex; align-items:center; justify-content:center; gap:10px; padding:13px; border-radius:980px; border:1px solid var(--line-2); background:#fff; font-weight:600; font-size:15px; cursor:pointer; }
        .gbtn:hover{ background:var(--surface-2); }
        .sep{ display:flex; align-items:center; gap:14px; color:var(--faint); font-size:13px; margin:22px 0; }
        .sep::before,.sep::after{ content:""; flex:1; height:1px; background:var(--line); }
        .auth-logo{ position:relative; z-index:2; }
        .gap16{ gap:16px; }
        @media (max-width:820px){ .auth{ grid-template-columns:1fr; } .auth-side{ display:none; } }
      `,
        }}
      />
      <div className="auth">
        <div className="auth-side">
          <div className="glow" />
          <Link className="logo auth-logo" href="/" style={{ filter: 'brightness(0) invert(1)' }}>
            <Image
              src="/mb-logo.png"
              alt="MB"
              width={30}
              height={30}
              style={{ height: '30px', width: 'auto' }}
            />
            <span className="lk">
              <b style={{ color: '#fff' }}>Fábio Borges</b>
              <span style={{ color: 'rgba(255,255,255,.6)' }}>
                Mentoria Profissional em Estética
              </span>
            </span>
          </Link>
          <div className="auth-logo">
            <div className="quote">
              &ldquo;A diferença entre amadora e referência está na técnica certa.&rdquo;
            </div>
            <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="avatar" style={{ background: 'var(--blue)' }}>
                FB
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>Fábio Borges</div>
                <div style={{ color: 'rgba(255,255,255,.6)', fontSize: '13px' }}>Mentor</div>
              </div>
            </div>
          </div>
          <div className="auth-logo" style={{ color: 'rgba(255,255,255,.45)', fontSize: '13px' }}>
            12.000+ profissionais já evoluíram com a mentoria.
          </div>
        </div>

        <div className="auth-form">
          <Suspense
            fallback={
              <div className="auth-card">
                <p className="muted">Carregando...</p>
              </div>
            }
          >
            <LoginFormContent />
          </Suspense>
        </div>
      </div>
    </>
  )
}
