'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'

const novaSenhaSchema = z
  .object({
    password: z.string().min(8, 'Senha deve ter no minimo 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas nao coincidem',
    path: ['confirmPassword'],
  })

type NovaSenhaForm = z.infer<typeof novaSenhaSchema>

export default function NovaSenhaPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NovaSenhaForm>({ resolver: zodResolver(novaSenhaSchema) })

  async function onSubmit(data: NovaSenhaForm) {
    setServerError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: data.password })

    if (error) {
      setServerError('Link expirado ou sessao invalida. Solicite um novo link de recuperacao.')
      return
    }

    setSuccess(true)
    setTimeout(() => {
      router.push('/auth/login')
      router.refresh()
    }, 1800)
  }

  return (
    <>
      <style>{`
        .ns-wrap{ min-height:100vh; display:grid; place-items:center; padding:24px; }
        .ns{ width:100%; max-width:400px; text-align:center; }
        .ns .card{ padding:38px 34px; text-align:left; }
        .ic-top{ width:54px; height:54px; border-radius:15px; background:var(--blue-tint); color:var(--blue-600); display:grid; place-items:center; margin:0 auto 20px; }
        .ic-top.ok{ background:var(--green-tint); color:#178a4a; }
        .gap16{ gap:16px; }
      `}</style>
      <div className="ns-wrap">
        <div className="ns">
          <Link
            className="logo"
            href="/"
            style={{ justifyContent: 'center', marginBottom: '26px' }}
          >
            <Image
              src="/mb-logo.png"
              alt="MB"
              width={30}
              height={30}
              style={{ height: '30px', width: 'auto' }}
            />
            <span className="lk">
              <b>Fabio Borges</b>
              <span>Mentoria Profissional em Estetica</span>
            </span>
          </Link>

          <div className="card">
            {success ? (
              <>
                <div className="ic-top ok">
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
                <h1 style={{ fontSize: '24px', textAlign: 'center' }}>Senha atualizada</h1>
                <p className="muted center" style={{ margin: '10px 0 22px', fontSize: '14.5px' }}>
                  Voce sera redirecionada para o login em instantes.
                </p>
              </>
            ) : (
              <>
                <div className="ic-top">
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <h1 style={{ fontSize: '24px', textAlign: 'center' }}>Criar nova senha</h1>
                <p className="muted center" style={{ margin: '10px 0 24px', fontSize: '14.5px' }}>
                  Informe uma nova senha para acessar sua conta.
                </p>
                <form className="col gap16" noValidate onSubmit={handleSubmit(onSubmit)}>
                  <div className="field">
                    <label htmlFor="password">Nova senha</label>
                    <input
                      id="password"
                      {...register('password')}
                      className="input"
                      type="password"
                      autoComplete="new-password"
                      placeholder="********"
                    />
                    {errors.password && (
                      <span style={{ color: '#d23b3b', fontSize: '13px' }}>
                        {errors.password.message}
                      </span>
                    )}
                  </div>
                  <div className="field">
                    <label htmlFor="confirmPassword">Confirmar nova senha</label>
                    <input
                      id="confirmPassword"
                      {...register('confirmPassword')}
                      className="input"
                      type="password"
                      autoComplete="new-password"
                      placeholder="********"
                    />
                    {errors.confirmPassword && (
                      <span style={{ color: '#d23b3b', fontSize: '13px' }}>
                        {errors.confirmPassword.message}
                      </span>
                    )}
                  </div>
                  {serverError && (
                    <p style={{ color: '#d23b3b', fontSize: '14px' }}>{serverError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary btn-lg btn-block"
                  >
                    {isSubmitting ? 'Salvando...' : 'Atualizar senha'}
                  </button>
                </form>
                <p className="center" style={{ marginTop: '20px' }}>
                  <Link href="/auth/recuperar-senha" className="muted" style={{ fontSize: '14px' }}>
                    Solicitar novo link
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
