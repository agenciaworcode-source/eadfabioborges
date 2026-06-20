'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type UsersUpdate = Database['public']['Tables']['users']['Update']

const profileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  specialty: z.string().optional(),
  city: z.string().optional(),
})

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual'),
    newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

interface ProfileFormProps {
  userId: string
  email: string
  initials: string
  initialData: {
    name: string
    avatar_url: string | null
    specialty: string | null
    city: string | null
  }
}

export function ProfileForm({ userId, email, initials, initialData }: ProfileFormProps) {
  const [profileToast, setProfileToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [passwordToast, setPasswordToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const {
    register: registerProfile,
    handleSubmit: handleProfile,
    formState: { errors: profileErrors, isSubmitting: profileSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: initialData.name,
      specialty: initialData.specialty ?? '',
      city: initialData.city ?? '',
    },
  })

  const {
    register: registerPassword,
    handleSubmit: handlePassword,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: passwordSubmitting },
  } = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) })

  async function onProfileSubmit(data: ProfileFormData) {
    setProfileToast(null)
    const supabase = createClient()
    const payload: UsersUpdate = {
      name: data.name,
      specialty: data.specialty || null,
      city: data.city || null,
    }
    const { error } = await supabase
      .from('users')
      .update(payload as never)
      .eq('id', userId)

    if (error) {
      setProfileToast({ type: 'error', msg: 'Erro ao salvar. Tente novamente.' })
    } else {
      setProfileToast({ type: 'success', msg: 'Perfil atualizado com sucesso!' })
      setTimeout(() => setProfileToast(null), 3000)
    }
  }

  async function onPasswordSubmit(data: PasswordFormData) {
    setPasswordToast(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: data.newPassword })
    if (error) {
      setPasswordToast({ type: 'error', msg: 'Erro ao atualizar senha. Tente novamente.' })
    } else {
      setPasswordToast({ type: 'success', msg: 'Senha atualizada com sucesso!' })
      resetPassword()
      setTimeout(() => setPasswordToast(null), 3000)
    }
  }

  return (
    <>
      {/* CARD: Dados pessoais */}
      <div className="card card-pad">
        {/* Upload de foto */}
        <div className="upload">
          <div className="ph">
            <div className="avatar lg">{initials}</div>
            <div className="cam">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>Foto de perfil</div>
            <p className="muted" style={{ fontSize: '13.5px', margin: '3px 0 10px' }}>
              JPG ou PNG, até 4MB.
            </p>
            <div className="flex gap8">
              <button type="button" className="btn btn-ghost btn-sm" disabled style={{ opacity: 0.5 }}>
                Enviar nova
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled
                style={{ opacity: 0.5, color: '#d23b3b', borderColor: '#f3d2d2' }}
              >
                Remover
              </button>
            </div>
          </div>
        </div>

        <hr className="soft-divider" style={{ margin: '24px 0' }} />

        <form onSubmit={handleProfile(onProfileSubmit)}>
          {profileToast && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--r-sm)',
                marginBottom: '16px',
                fontSize: '14px',
                background: profileToast.type === 'success' ? 'var(--green-tint)' : '#fde8e8',
                color: profileToast.type === 'success' ? '#178a4a' : '#d23b3b',
              }}
            >
              {profileToast.msg}
            </div>
          )}

          <div className="grid g2">
            <div className="field">
              <label htmlFor="name">Nome completo</label>
              <input id="name" {...registerProfile('name')} className="input" placeholder="Maria Silva" />
              {profileErrors.name && (
                <span style={{ color: '#d23b3b', fontSize: '13px' }}>{profileErrors.name.message}</span>
              )}
            </div>
            <div className="field">
              <label>E-mail</label>
              <input
                className="input"
                value={email}
                readOnly
                style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}
              />
            </div>
            <div className="field">
              <label htmlFor="specialty">Especialidade</label>
              <input
                id="specialty"
                {...registerProfile('specialty')}
                className="input"
                placeholder="Ex: Esteticista · Eletroterapia"
              />
            </div>
            <div className="field">
              <label htmlFor="city">Cidade</label>
              <input
                id="city"
                {...registerProfile('city')}
                className="input"
                placeholder="Ex: Campinas, SP"
              />
            </div>
          </div>

          <div className="flex gap12" style={{ marginTop: '20px' }}>
            <button type="submit" disabled={profileSubmitting} className="btn btn-primary">
              {profileSubmitting ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </div>

      {/* CARD: Alterar senha */}
      <div className="card card-pad">
        <h3 style={{ fontSize: '18px' }}>Alterar senha</h3>

        <form onSubmit={handlePassword(onPasswordSubmit)}>
          {passwordToast && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--r-sm)',
                marginBottom: '16px',
                marginTop: '16px',
                fontSize: '14px',
                background: passwordToast.type === 'success' ? 'var(--green-tint)' : '#fde8e8',
                color: passwordToast.type === 'success' ? '#178a4a' : '#d23b3b',
              }}
            >
              {passwordToast.msg}
            </div>
          )}

          <div className="grid g2" style={{ marginTop: '16px' }}>
            <div className="field" style={{ gridColumn: '1/-1' }}>
              <label htmlFor="currentPassword">Senha atual</label>
              <input
                id="currentPassword"
                {...registerPassword('currentPassword')}
                className="input"
                type="password"
                placeholder="••••••••"
              />
              {passwordErrors.currentPassword && (
                <span style={{ color: '#d23b3b', fontSize: '13px' }}>
                  {passwordErrors.currentPassword.message}
                </span>
              )}
            </div>
            <div className="field">
              <label htmlFor="newPassword">Nova senha</label>
              <input
                id="newPassword"
                {...registerPassword('newPassword')}
                className="input"
                type="password"
                placeholder="••••••••"
              />
              {passwordErrors.newPassword && (
                <span style={{ color: '#d23b3b', fontSize: '13px' }}>
                  {passwordErrors.newPassword.message}
                </span>
              )}
            </div>
            <div className="field">
              <label htmlFor="confirmPassword">Confirmar nova senha</label>
              <input
                id="confirmPassword"
                {...registerPassword('confirmPassword')}
                className="input"
                type="password"
                placeholder="••••••••"
              />
              {passwordErrors.confirmPassword && (
                <span style={{ color: '#d23b3b', fontSize: '13px' }}>
                  {passwordErrors.confirmPassword.message}
                </span>
              )}
            </div>
          </div>

          <button type="submit" disabled={passwordSubmitting} className="btn btn-dark" style={{ marginTop: '18px' }}>
            {passwordSubmitting ? 'Atualizando...' : 'Atualizar senha'}
          </button>
        </form>
      </div>
    </>
  )
}
