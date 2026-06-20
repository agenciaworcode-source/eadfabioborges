import { describe, expect, it } from 'vitest'
import { buildVimeoPlayerSrc, normalizeVimeoInput } from '@/lib/vimeo'

describe('vimeo helpers', () => {
  it('mantem ID numerico simples', () => {
    expect(normalizeVimeoInput('123456789')).toBe('123456789')
  })

  it('extrai ID de URL publica do Vimeo', () => {
    expect(normalizeVimeoInput('https://vimeo.com/123456789')).toBe('123456789')
  })

  it('preserva hash privado de URL do player', () => {
    expect(
      normalizeVimeoInput('https://player.vimeo.com/video/123456789?h=abc123')
    ).toBe('https://player.vimeo.com/video/123456789?h=abc123')
  })

  it('extrai src de iframe Vimeo', () => {
    expect(
      normalizeVimeoInput(
        '<iframe src="https://player.vimeo.com/video/123456789?h=abc123"></iframe>'
      )
    ).toBe('https://player.vimeo.com/video/123456789?h=abc123')
  })

  it('monta src do player com parametros padrao', () => {
    const src = buildVimeoPlayerSrc('123456789')
    expect(src).toContain('https://player.vimeo.com/video/123456789')
    expect(src).toContain('title=0')
    expect(src).toContain('dnt=1')
  })
})
