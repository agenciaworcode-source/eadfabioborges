import type { Json } from '@/types/database'

export interface CertificateTemplate {
  id?: string
  name: string
  is_default: boolean
  title: string
  body_template: string
  issuer_name: string
  issuer_role: string
  signature_url: string | null
  logo_url: string | null
  background_url: string | null
  primary_color: string
  layout_config: Json
}

export interface CertificateTemplateVariables {
  studentName: string
  courseName: string
  courseHours: number
  score: number
  issuedAt: string
}

export const DEFAULT_CERTIFICATE_TEMPLATE: CertificateTemplate = {
  name: 'Modelo padrão',
  is_default: true,
  title: 'Certificado de Conclusão',
  body_template:
    'Certificamos que {{student_name}} concluiu com aproveitamento o curso {{course_name}}.',
  issuer_name: 'Fábio Borges',
  issuer_role: 'Mentor · Fábio Borges Mentoria',
  signature_url: null,
  logo_url: null,
  background_url: null,
  primary_color: '#48a1fe',
  layout_config: {},
}

const tokenMap: Record<keyof CertificateTemplateVariables, string> = {
  studentName: 'student_name',
  courseName: 'course_name',
  courseHours: 'course_hours',
  score: 'score',
  issuedAt: 'issued_at',
}

export function normalizeHexColor(value: string | null | undefined): string {
  if (!value) return DEFAULT_CERTIFICATE_TEMPLATE.primary_color
  const trimmed = value.trim()
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) return trimmed
  return DEFAULT_CERTIFICATE_TEMPLATE.primary_color
}

export function renderCertificateTemplate(
  template: string,
  variables: CertificateTemplateVariables
): string {
  return Object.entries(tokenMap).reduce((result, [key, token]) => {
    const value = variables[key as keyof CertificateTemplateVariables]
    return result.replaceAll(`{{${token}}}`, String(value))
  }, template)
}

export function resolveCertificateTemplate(
  template?: Partial<CertificateTemplate> | null
): CertificateTemplate {
  return {
    ...DEFAULT_CERTIFICATE_TEMPLATE,
    ...template,
    is_default: template?.is_default ?? true,
    primary_color: normalizeHexColor(template?.primary_color),
    signature_url: template?.signature_url ?? null,
    logo_url: template?.logo_url ?? null,
    background_url: template?.background_url ?? null,
    layout_config: template?.layout_config ?? {},
  }
}
