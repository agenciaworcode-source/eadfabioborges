'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
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

function CadastroFormContent() {
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl') ?? '/dashboard'

  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CadastroForm>({ resolver: zodResolver(cadastroSchema) })

  async function onSubmit(data: CadastroForm) {
    setServerError(null)

    // Cria o usuário via API server-side (Admin SDK, sem rate limit de email do Supabase)
    const res = await fetch('/api/auth/cadastro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: data.name, email: data.email, password: data.password }),
    })

    const json = (await res.json()) as { success?: boolean; error?: string }

    if (!res.ok) {
      setServerError(json.error ?? 'Erro ao criar conta. Tente novamente.')
      return
    }

    // Já loga o usuário imediatamente após criar conta
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (signInError) {
      // Conta criada mas login falhou — direciona para login manual
      setSuccess(true)
      return
    }

    // Redireciona para returnUrl
    window.location.href = returnUrl
  }

  const loginHref =
    returnUrl !== '/dashboard'
      ? `/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`
      : '/auth/login'

  if (success) {
    return (
      <div className="auth-form">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--green-tint)',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 24px',
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--green)"
              strokeWidth="2"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h1 style={{ fontSize: '30px' }}>Conta criada!</h1>
          <p className="muted" style={{ margin: '10px 0 24px' }}>
            Sua conta foi criada com sucesso. Faça login para continuar.
          </p>
          <Link href={loginHref} className="btn btn-primary btn-block">
            Ir para o login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-form">
      <div className="auth-card">
        <h1 style={{ fontSize: '30px' }}>Criar conta</h1>
        <p className="muted" style={{ margin: '10px 0 26px' }}>
          Leva menos de um minuto.
        </p>

        <form className="col gap16" noValidate onSubmit={handleSubmit(onSubmit)}>
          <div className="field">
            <label htmlFor="name">Nome completo</label>
            <input id="name" {...register('name')} className="input" placeholder="Maria Silva" />
            {errors.name && (
              <span style={{ color: '#d23b3b', fontSize: '13px' }}>{errors.name.message}</span>
            )}
          </div>

          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              {...register('email')}
              className="input"
              type="email"
              placeholder="voce@email.com"
            />
            {errors.email && (
              <span style={{ color: '#d23b3b', fontSize: '13px' }}>{errors.email.message}</span>
            )}
          </div>

          <div className="grid g2" style={{ gap: '14px' }}>
            <div className="field">
              <label htmlFor="password">Senha</label>
              <input
                id="password"
                {...register('password')}
                className="input"
                type="password"
                placeholder="••••••••"
              />
              {errors.password && (
                <span style={{ color: '#d23b3b', fontSize: '13px' }}>
                  {errors.password.message}
                </span>
              )}
            </div>
            <div className="field">
              <label htmlFor="confirmPassword">Confirmar</label>
              <input
                id="confirmPassword"
                {...register('confirmPassword')}
                className="input"
                type="password"
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <span style={{ color: '#d23b3b', fontSize: '13px' }}>
                  {errors.confirmPassword.message}
                </span>
              )}
            </div>
          </div>

          <label
            className="flex aic gap12"
            style={{ fontSize: '13.5px', color: 'var(--ink-2)', cursor: 'pointer' }}
          >
            <input
              type="checkbox"
              {...register('terms')}
              style={{ width: '17px', height: '17px', accentColor: 'var(--blue)' }}
            />
            Concordo com os{' '}
            <Link href="#" className="blue">
              Termos
            </Link>{' '}
            e{' '}
            <Link href="#" className="blue">
              Privacidade
            </Link>
            .
          </label>
          {errors.terms && (
            <span style={{ color: '#d23b3b', fontSize: '13px' }}>{errors.terms.message}</span>
          )}

          {serverError && <p style={{ color: '#d23b3b', fontSize: '14px' }}>{serverError}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary btn-lg btn-block"
          >
            {isSubmitting ? 'Criando conta...' : 'Criar minha conta'}
          </button>
        </form>

        <p className="muted center" style={{ marginTop: '22px', fontSize: '14px' }}>
          Já tem conta?{' '}
          <Link href={loginHref} className="blue" style={{ fontWeight: 600 }}>
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}

function AuthSide() {
  return (
    <div className="auth-side">
      <div className="glow2" />
      <Link className="logo z2" href="/" style={{ filter: 'brightness(0) invert(1)' }}>
        <Image
          src="/mb-logo.png"
          alt="MB"
          width={30}
          height={30}
          style={{ height: '30px', width: 'auto' }}
        />
        <span className="lk">
          <b style={{ color: '#fff' }}>Fábio Borges</b>
          <span style={{ color: 'rgba(255,255,255,.6)' }}>Mentoria Profissional em Estética</span>
        </span>
      </Link>
      <div className="z2">
        <h2 style={{ color: '#fff', fontSize: '30px', maxWidth: '18ch' }}>
          Comece grátis. Evolua sem limites.
        </h2>
        <div style={{ marginTop: '26px' }}>
          <div className="perk">
            <span className="pk">{checkSvg}</span>Acesso imediato a 2 cursos intro
          </div>
          <div className="perk">
            <span className="pk">{checkSvg}</span>Sem cartão de crédito
          </div>
          <div className="perk">
            <span className="pk">{checkSvg}</span>Certificado em cada trilha
          </div>
        </div>
      </div>
      <div className="z2" style={{ color: 'rgba(255,255,255,.45)', fontSize: '13px' }}>
        ★★★★★ 4,9 de avaliação média entre alunas.
      </div>
    </div>
  )
}

export default function CadastroPage() {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
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
      `,
        }}
      />
      <div className="auth">
        <AuthSide />
        <Suspense
          fallback={
            <div className="auth-form">
              <div className="auth-card">
                <p className="muted">Carregando...</p>
              </div>
            </div>
          }
        >
          <CadastroFormContent />
        </Suspense>
      </div>
    </>
  )
}
