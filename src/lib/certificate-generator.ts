import { PDFDocument, rgb, StandardFonts, type PDFFont } from 'pdf-lib'
import QRCode from 'qrcode'
import { createServiceClient } from '@/lib/supabase/service'
import {
  resolveCertificateTemplate,
  renderCertificateTemplate,
  type CertificateTemplate,
} from '@/lib/certificates/templates'

export interface CertificateData {
  userName: string
  courseName: string
  courseHours: number
  score: number
  issuedAt: Date
  uuid: string
  userId: string
  template?: Partial<CertificateTemplate> | null
}

const ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ead.fabioborgesoficial.com.br'

const PAGE_W = 841.89
const PAGE_H = 595.28

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '')
  const value = Number.parseInt(normalized, 16)
  return rgb(((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255)
}

function width(text: string, font: PDFFont, size: number) {
  return font.widthOfTextAtSize(text, size)
}

function drawCenteredText({
  page,
  text,
  y,
  size,
  font,
  color,
}: {
  page: ReturnType<PDFDocument['addPage']>
  text: string
  y: number
  size: number
  font: PDFFont
  color: ReturnType<typeof rgb>
}) {
  page.drawText(text, {
    x: (PAGE_W - width(text, font, size)) / 2,
    y,
    size,
    font,
    color,
  })
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (width(next, font, size) <= maxWidth) {
      current = next
    } else {
      if (current) lines.push(current)
      current = word
    }
  }

  if (current) lines.push(current)
  return lines
}

async function embedRemoteImage(pdfDoc: PDFDocument, url: string) {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const bytes = new Uint8Array(await response.arrayBuffer())
    const contentType = response.headers.get('content-type') ?? ''
    if (contentType.includes('png') || url.toLowerCase().endsWith('.png')) {
      return await pdfDoc.embedPng(bytes)
    }
    return await pdfDoc.embedJpg(bytes)
  } catch {
    return null
  }
}

export async function generateCertificatePdf(data: CertificateData): Promise<Uint8Array> {
  const template = resolveCertificateTemplate(data.template)
  const primary = hexToRgb(template.primary_color)
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([PAGE_W, PAGE_H])

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)

  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_W,
    height: PAGE_H,
    color: rgb(1, 1, 1),
  })

  if (template.background_url) {
    const background = await embedRemoteImage(pdfDoc, template.background_url)
    if (background) {
      page.drawImage(background, { x: 0, y: 0, width: PAGE_W, height: PAGE_H })
    }
  }

  page.drawRectangle({
    x: 0,
    y: PAGE_H - 60,
    width: PAGE_W,
    height: 60,
    color: rgb(0.114, 0.114, 0.122),
  })

  if (template.logo_url) {
    const logo = await embedRemoteImage(pdfDoc, template.logo_url)
    if (logo) {
      const scale = Math.min(34 / logo.width, 34 / logo.height)
      page.drawImage(logo, {
        x: 36,
        y: PAGE_H - 48,
        width: logo.width * scale,
        height: logo.height * scale,
      })
    }
  }

  page.drawText('Fabio Borges', {
    x: template.logo_url ? 82 : 36,
    y: PAGE_H - 38,
    size: 16,
    font: fontBold,
    color: rgb(1, 1, 1),
  })
  page.drawText('Mentoria Profissional em Estetica', {
    x: template.logo_url ? 82 : 36,
    y: PAGE_H - 54,
    size: 9,
    font: fontReg,
    color: rgb(0.8, 0.8, 0.8),
  })

  page.drawText('Certificado valido', {
    x: PAGE_W - 150,
    y: PAGE_H - 38,
    size: 11,
    font: fontBold,
    color: rgb(0.149, 0.698, 0.435),
  })

  const margin = 18
  page.drawRectangle({
    x: margin,
    y: margin,
    width: PAGE_W - margin * 2,
    height: PAGE_H - 60 - margin * 2,
    borderColor: rgb(0.886, 0.925, 0.984),
    borderWidth: 1.5,
  })

  const contentTop = PAGE_H - 96
  drawCenteredText({
    page,
    text: template.title.toUpperCase(),
    y: contentTop,
    size: 10,
    font: fontReg,
    color: rgb(0.68, 0.68, 0.68),
  })

  const body = renderCertificateTemplate(template.body_template, {
    studentName: data.userName,
    courseName: data.courseName,
    courseHours: data.courseHours,
    score: Number(data.score.toFixed(1)),
    issuedAt: formatDate(data.issuedAt),
  })

  const nameSize = data.userName.length > 30 ? 28 : 34
  drawCenteredText({
    page,
    text: data.userName,
    y: contentTop - 58,
    size: nameSize,
    font: fontBold,
    color: rgb(0.114, 0.114, 0.122),
  })

  const bodyLines = wrapText(body, fontReg, 12, 620).slice(0, 3)
  bodyLines.forEach((line, index) => {
    drawCenteredText({
      page,
      text: line,
      y: contentTop - 94 - index * 16,
      size: 12,
      font: fontReg,
      color: rgb(0.43, 0.43, 0.43),
    })
  })

  const courseSize = data.courseName.length > 40 ? 16 : 20
  drawCenteredText({
    page,
    text: data.courseName,
    y: contentTop - 150,
    size: courseSize,
    font: fontBold,
    color: primary,
  })

  const gridY = contentTop - 214
  const gridItems = [
    { label: 'CARGA HORARIA', value: `${data.courseHours} horas` },
    { label: 'NOTA FINAL', value: `${data.score.toFixed(1)} / 10` },
    { label: 'CONCLUIDO EM', value: formatDate(data.issuedAt) },
  ]
  const cellW = 200
  const startX = (PAGE_W - cellW * 3) / 2

  gridItems.forEach((item, i) => {
    const cx = startX + i * cellW
    page.drawRectangle({
      x: cx,
      y: gridY - 44,
      width: cellW - 8,
      height: 52,
      borderColor: rgb(0.878, 0.878, 0.886),
      borderWidth: 1,
      color: rgb(1, 1, 1),
    })
    drawCenteredText({
      page,
      text: item.label,
      y: gridY - 26,
      size: 7,
      font: fontReg,
      color: rgb(0.68, 0.68, 0.68),
    })
    page.drawText(item.value, {
      x: cx + (cellW - 8 - width(item.value, fontBold, 14)) / 2,
      y: gridY - 42,
      size: 14,
      font: fontBold,
      color: rgb(0.114, 0.114, 0.122),
    })
  })

  const sigX = 80
  const sigY = gridY - 86

  if (template.signature_url) {
    const signature = await embedRemoteImage(pdfDoc, template.signature_url)
    if (signature) {
      const scale = Math.min(180 / signature.width, 58 / signature.height)
      page.drawImage(signature, {
        x: sigX,
        y: sigY + 8,
        width: signature.width * scale,
        height: signature.height * scale,
      })
    }
  } else {
    page.drawText(template.issuer_name, {
      x: sigX,
      y: sigY + 18,
      size: 22,
      font: fontOblique,
      color: rgb(0.114, 0.114, 0.122),
    })
  }

  page.drawLine({
    start: { x: sigX, y: sigY + 8 },
    end: { x: sigX + 210, y: sigY + 8 },
    thickness: 1.2,
    color: rgb(0.114, 0.114, 0.122),
  })
  page.drawText(template.issuer_name, {
    x: sigX,
    y: sigY - 6,
    size: 10,
    font: fontBold,
    color: rgb(0.114, 0.114, 0.122),
  })
  page.drawText(template.issuer_role, {
    x: sigX,
    y: sigY - 20,
    size: 8.5,
    font: fontReg,
    color: rgb(0.56, 0.56, 0.56),
  })

  try {
    const qrUrl = `${ORIGIN}/certificado/${data.uuid}`
    const qrBuffer = await QRCode.toBuffer(qrUrl, {
      width: 80,
      margin: 1,
      errorCorrectionLevel: 'M',
    })
    const qrImage = await pdfDoc.embedPng(qrBuffer)
    page.drawImage(qrImage, {
      x: PAGE_W - 160,
      y: sigY - 10,
      width: 80,
      height: 80,
    })
    page.drawText('Verificar autenticidade', {
      x: PAGE_W - 166,
      y: sigY - 20,
      size: 8,
      font: fontReg,
      color: rgb(0.56, 0.56, 0.56),
    })
  } catch {
    // QR code is optional and must not block certificate generation.
  }

  const shortCode = `MB-${data.issuedAt.getFullYear()}-${data.uuid.slice(0, 6).toUpperCase()}`
  const footerText = `Codigo de verificacao: ${shortCode} - ${ORIGIN}/certificado/${data.uuid}`
  page.drawText(footerText, {
    x: (PAGE_W - width(footerText, fontReg, 7.5)) / 2,
    y: margin + 10,
    size: 7.5,
    font: fontReg,
    color: rgb(0.68, 0.68, 0.68),
  })

  return pdfDoc.save()
}

export async function uploadCertificatePdf(
  pdfBytes: Uint8Array,
  userId: string,
  uuid: string
): Promise<string | null> {
  try {
    const supabase = createServiceClient()
    const path = `${userId}/${uuid}.pdf`

    const { error } = await supabase.storage.from('certificates').upload(path, pdfBytes, {
      contentType: 'application/pdf',
      upsert: true,
    })

    if (error) return null

    const { data: signed } = await supabase.storage
      .from('certificates')
      .createSignedUrl(path, 60 * 60 * 24 * 365)

    return signed?.signedUrl ?? null
  } catch {
    return null
  }
}
