import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock QuizBuilder and AssignmentBuilder to avoid unrelated deps
vi.mock('@/components/admin/QuizBuilder', () => ({
  QuizBuilder: () => <div data-testid="quiz-builder" />,
}))
vi.mock('@/components/admin/AssignmentBuilder', () => ({
  AssignmentBuilder: () => <div data-testid="assignment-builder" />,
}))

// ─── Import component under test ─────────────────────────────────────────────

import { LessonEditor } from '@/components/admin/LessonEditor'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const defaultProps = {
  lessons: [],
  moduleId: 'module-1',
  onLessonsChange: vi.fn(),
}

function renderAndOpenForm(props?: Partial<typeof defaultProps>) {
  const result = render(<LessonEditor {...defaultProps} {...props} />)
  // Click "+ Adicionar aula" to open the form
  const addButton = screen.getByText('+ Adicionar aula')
  fireEvent.click(addButton)
  return result
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('LessonEditor — seletor de tipo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza 4 opcoes de tipo de aula', () => {
    renderAndOpenForm()

    expect(screen.getByText('VIDEO')).toBeInTheDocument()
    expect(screen.getByText('TEXTO')).toBeInTheDocument()
    expect(screen.getByText('PDF')).toBeInTheDocument()
    expect(screen.getByText('EMBED')).toBeInTheDocument()
  })
})

describe('LessonEditor — campos condicionais por tipo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('tipo Video exibe campo Vimeo ID e nao exibe campos de outros tipos', () => {
    renderAndOpenForm()

    // Default type is 'video' — Vimeo ID should be visible
    expect(
      screen.getByPlaceholderText('Ex: 123456789 ou player.vimeo.com/video/...')
    ).toBeInTheDocument()

    // Other type-specific fields should NOT be visible
    expect(screen.queryByPlaceholderText('https://exemplo.com/arquivo.pdf')).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText('https://exemplo.com/embed')).not.toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText('Escreva o conte\u00fado da aula aqui...')
    ).not.toBeInTheDocument()
  })

  it('tipo Texto exibe textarea content_body e nao exibe Vimeo ID', () => {
    renderAndOpenForm()

    // Click the TEXTO type button
    fireEvent.click(screen.getByText('TEXTO'))

    // Textarea for content should appear
    expect(
      screen.getByPlaceholderText('Escreva o conte\u00fado da aula aqui...')
    ).toBeInTheDocument()

    // Vimeo ID should NOT be visible
    expect(screen.queryByPlaceholderText('Ex: 123456789')).not.toBeInTheDocument()
  })

  it('tipo PDF exibe campo pdf_url e nao exibe Vimeo ID e content_body', () => {
    renderAndOpenForm()

    // Click the PDF type button
    fireEvent.click(screen.getByText('PDF'))

    // PDF URL input should appear
    expect(screen.getByPlaceholderText('https://exemplo.com/arquivo.pdf')).toBeInTheDocument()

    // Other type fields should NOT be visible
    expect(screen.queryByPlaceholderText('Ex: 123456789')).not.toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText('Escreva o conte\u00fado da aula aqui...')
    ).not.toBeInTheDocument()
  })

  it('tipo Embed exibe campo embed_url e preview quando URL preenchida', () => {
    renderAndOpenForm()

    // Click the EMBED type button
    fireEvent.click(screen.getByText('EMBED'))

    // Embed URL input should appear
    const embedInput = screen.getByPlaceholderText(/Cole a URL ou/i)
    expect(embedInput).toBeInTheDocument()

    // No preview iframe yet (empty URL)
    expect(screen.queryByTitle('Preview do embed')).not.toBeInTheDocument()

    // Type a URL to trigger preview
    fireEvent.change(embedInput, { target: { value: 'https://example.com/my-embed' } })

    // Preview iframe should now appear
    expect(screen.getByTitle('Preview do embed')).toBeInTheDocument()

    // Other type fields should NOT be visible
    expect(screen.queryByPlaceholderText('Ex: 123456789')).not.toBeInTheDocument()
  })
})
