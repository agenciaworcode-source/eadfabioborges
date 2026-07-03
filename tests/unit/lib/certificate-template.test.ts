import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CERTIFICATE_TEMPLATE,
  normalizeHexColor,
  renderCertificateTemplate,
  resolveCertificateTemplate,
} from '@/lib/certificates/templates'

describe('certificate templates', () => {
  it('renders known template variables', () => {
    expect(
      renderCertificateTemplate(
        '{{student_name}} concluiu {{course_name}} com nota {{score}} em {{issued_at}}.',
        {
          studentName: 'Maria Silva',
          courseName: 'Estetica Avancada',
          courseHours: 12,
          score: 9.5,
          issuedAt: '20/06/2026',
        }
      )
    ).toBe('Maria Silva concluiu Estetica Avancada com nota 9.5 em 20/06/2026.')
  })

  it('normalizes invalid colors to the default color', () => {
    expect(normalizeHexColor('#123abc')).toBe('#123abc')
    expect(normalizeHexColor('blue')).toBe(DEFAULT_CERTIFICATE_TEMPLATE.primary_color)
  })

  it('resolves partial templates with fallback values', () => {
    const resolved = resolveCertificateTemplate({
      title: 'Meu certificado',
      primary_color: 'invalid',
    })

    expect(resolved.title).toBe('Meu certificado')
    expect(resolved.issuer_name).toBe(DEFAULT_CERTIFICATE_TEMPLATE.issuer_name)
    expect(resolved.primary_color).toBe(DEFAULT_CERTIFICATE_TEMPLATE.primary_color)
  })
})
