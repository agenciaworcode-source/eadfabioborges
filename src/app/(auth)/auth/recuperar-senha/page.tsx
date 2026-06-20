'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'

const recuperarSchema = z.object({
  email: z.string().email('E-mail inválido'),
})

type RecuperarForm = z.infer<typeof recuperarSchema>

export default function RecuperarSenhaPage() {
  const [success, setSuccess] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RecuperarForm>({ resolver: zodResolver(recuperarSchema) })

  async function onSubmit(data: RecuperarForm) {
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/nova-senha`,
    })
    // Sempre mostra sucesso para não vazar se o e-mail existe
    setSubmittedEmail(data.email)
    setSuccess(true)
  }

  return (
    <>
      <style>{`
        .rc-wrap{ min-height:100vh; display:grid; place-items:center; padding:24px; }
        .rc{ width:100%; max-width:400px; text-align:center; }
        .rc .card{ padding:38px 34px; text-align:left; }
        .ic-top{ width:54px; height:54px; border-radius:15px; background:var(--blue-tint); color:var(--blue-600); display:grid; place-items:center; margin:0 auto 20px; }
        .ic-top.ok{ background:var(--green-tint); color:#178a4a; }
        .gap16{ gap:16px; }
      `}</style>
      <div className="rc-wrap">
        <div className="rc">
          <Link className="logo" href="/" style={{ justifyContent: 'center', marginBottom: '26px' }}>
            <Image src="/mb-logo.png" alt="MB" width={30} height={30} style={{ height: '30px', width: 'auto' }} />
            <span className="lk">
              <b>Fábio Borges</b>
              <span>Mentoria Profissional em Estética</span>
            </span>
          </Link>

          {success ? (
            <div className="card">
              <div className="ic-top ok">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <path d="m22 4-10 10.01-3-3" />
                </svg>
              </div>
              <h1 style={{ fontSize: '24px', textAlign: 'center' }}>Verifique seu e-mail</h1>
              <p className="muted center" style={{ margin: '10px 0 22px', fontSize: '14.5px' }}>
                Enviamos um link de recuperação para{' '}
                <b style={{ color: 'var(--ink)' }}>{submittedEmail}</b>. Confira a caixa de entrada e o spam.
              </p>
              <Link className="btn btn-ghost btn-block" href="/auth/login">
                Voltar para o login
              </Link>
              <p className="center muted" style={{ marginTop: '16px', fontSize: '13px' }}>
                Não recebeu?{' '}
                <button
                  onClick={() => setSuccess(false)}
                  className="blue"
                  style={{ background: 'none', border: 'none', padding: 0, fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}
                >
                  Reenviar
                </button>
              </p>
            </div>
          ) : (
            <div className="card">
              <div className="ic-top">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                </svg>
              </div>
              <h1 style={{ fontSize: '24px', textAlign: 'center' }}>Recuperar senha</h1>
              <p className="muted center" style={{ margin: '10px 0 24px', fontSize: '14.5px' }}>
                Digite o seu e-mail e enviaremos um link para redefinir a sua senha.
              </p>
              <form className="col gap16" onSubmit={handleSubmit(onSubmit)}>
                <div className="field">
                  <label htmlFor="email">E-mail</label>
                  <div className="input-icn">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
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
                <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-lg btn-block">
                  {isSubmitting ? 'Enviando...' : 'Enviar link de recuperação'}
                </button>
              </form>
              <p className="center" style={{ marginTop: '20px' }}>
                <Link href="/auth/login" className="muted" style={{ fontSize: '14px' }}>
                  ← Voltar para o login
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
