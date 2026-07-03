import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

const mockUseEnrollment = vi.fn()

vi.mock('@/hooks/use-enrollment', () => ({
  useEnrollment: (...args: unknown[]) => mockUseEnrollment(...args),
}))

import { AccessGate } from '@/components/shared/AccessGate'

describe('AccessGate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mostra mensagem de expiracao quando enrollment expirou', () => {
    mockUseEnrollment.mockReturnValue({
      hasAccess: false,
      isLoading: false,
      expiresAt: '2026-06-15T00:00:00.000Z',
      isExpired: true,
      error: null,
    })

    render(
      <AccessGate courseId="course-1" courseSlug="curso-teste" courseName="Curso Teste">
        <div>Conteudo</div>
      </AccessGate>
    )

    expect(screen.getByText('Acesso expirado')).toBeInTheDocument()
    expect(screen.getByText(/14\/06\/2026/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Renovar acesso' })).toHaveAttribute('href', '/planos')
    expect(screen.getByRole('link', { name: 'Ver curso' })).toHaveAttribute(
      'href',
      '/cursos/curso-teste'
    )
  })
})
