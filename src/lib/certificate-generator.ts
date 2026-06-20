import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import QRCode from 'qrcode'
import { createClient } from '@/lib/supabase/server'

export interface CertificateData {
  userName: string
  courseName: string
  courseHours: number
  score: number // 0–10
  issuedAt: Date
  uuid: string // certificate ID
  userId: string
}

const ORIGIN =
  process.env.NEXT_PUBLIC_APP_URL ?? 'https://ead.fabioborgesoficial.com.br'

// A4 landscape in points
const PAGE_W = 841.89
const PAGE_H = 595.28

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export async function generateCertificatePdf(
  data: CertificateData
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([PAGE_W, PAGE_H])

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)

  // ─── Background ───────────────────────────────────────────────────────────
  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_W,
    height: PAGE_H,
    color: rgb(1, 1, 1),
  })

  // ─── Header dark band ─────────────────────────────────────────────────────
  page.drawRectangle({
    x: 0,
    y: PAGE_H - 60,
    width: PAGE_W,
    height: 60,
    color: rgb(0.114, 0.114, 0.122), // #1d1d1f
  })

  // Header: brand name
  page.drawText('Fábio Borges', {
    x: 36,
    y: PAGE_H - 38,
    size: 16,
    font: fontBold,
    color: rgb(1, 1, 1),
  })
  page.drawText('Mentoria Profissional em Estética', {
    x: 36,
    y: PAGE_H - 54,
    size: 9,
    font: fontReg,
    color: rgb(0.8, 0.8, 0.8),
  })

  // Header right: "Certificado válido" badge
  page.drawText('✓ Certificado válido', {
    x: PAGE_W - 160,
    y: PAGE_H - 38,
    size: 11,
    font: fontBold,
    color: rgb(0.149, 0.698, 0.435), // green
  })

  // ─── Inner border ─────────────────────────────────────────────────────────
  const margin = 18
  page.drawRectangle({
    x: margin,
    y: margin,
    width: PAGE_W - margin * 2,
    height: PAGE_H - 60 - margin * 2,
    borderColor: rgb(0.886, 0.925, 0.984), // #e2ecfb
    borderWidth: 1.5,
    color: rgb(1, 1, 1),
  })

  // ─── Content ──────────────────────────────────────────────────────────────
  const contentTop = PAGE_H - 60 - 36

  // Eyebrow
  const eyebrow = 'CERTIFICADO DE CONCLUSÃO'
  const eyebrowW = fontReg.widthOfTextAtSize(eyebrow, 9)
  page.drawText(eyebrow, {
    x: (PAGE_W - eyebrowW) / 2,
    y: contentTop,
    size: 9,
    font: fontReg,
    color: rgb(0.68, 0.68, 0.68),
  })

  // "Certificamos que"
  const line1 = 'Certificamos que'
  const line1W = fontReg.widthOfTextAtSize(line1, 12)
  page.drawText(line1, {
    x: (PAGE_W - line1W) / 2,
    y: contentTop - 28,
    size: 12,
    font: fontReg,
    color: rgb(0.43, 0.43, 0.43),
  })

  // Student name
  const nameSize = data.userName.length > 30 ? 28 : 34
  const nameW = fontBold.widthOfTextAtSize(data.userName, nameSize)
  page.drawText(data.userName, {
    x: (PAGE_W - nameW) / 2,
    y: contentTop - 64,
    size: nameSize,
    font: fontBold,
    color: rgb(0.114, 0.114, 0.122),
  })

  // "concluiu com aproveitamento o curso"
  const line2 = 'concluiu com aproveitamento o curso'
  const line2W = fontReg.widthOfTextAtSize(line2, 12)
  page.drawText(line2, {
    x: (PAGE_W - line2W) / 2,
    y: contentTop - 96,
    size: 12,
    font: fontReg,
    color: rgb(0.43, 0.43, 0.43),
  })

  // Course name
  const courseSize = data.courseName.length > 40 ? 16 : 20
  const courseW = fontBold.widthOfTextAtSize(data.courseName, courseSize)
  page.drawText(data.courseName, {
    x: (PAGE_W - courseW) / 2,
    y: contentTop - 122,
    size: courseSize,
    font: fontBold,
    color: rgb(0.282, 0.631, 0.996), // #48a1fe
  })

  // ─── Info grid ────────────────────────────────────────────────────────────
  const gridY = contentTop - 188
  const gridItems = [
    { label: 'CARGA HORÁRIA', value: `${data.courseHours} horas` },
    { label: 'NOTA FINAL', value: `${data.score.toFixed(1)} / 10` },
    { label: 'CONCLUÍDO EM', value: formatDate(data.issuedAt) },
  ]
  const cellW = 200
  const startX = (PAGE_W - cellW * 3) / 2

  gridItems.forEach((item, i) => {
    const cx = startX + i * cellW
    // Border
    page.drawRectangle({
      x: cx,
      y: gridY - 44,
      width: cellW - 8,
      height: 52,
      borderColor: rgb(0.878, 0.878, 0.886),
      borderWidth: 1,
      color: rgb(1, 1, 1),
    })
    // Label
    const lW = fontReg.widthOfTextAtSize(item.label, 7)
    page.drawText(item.label, {
      x: cx + (cellW - 8 - lW) / 2,
      y: gridY - 26,
      size: 7,
      font: fontReg,
      color: rgb(0.68, 0.68, 0.68),
    })
    // Value
    const vW = fontBold.widthOfTextAtSize(item.value, 14)
    page.drawText(item.value, {
      x: cx + (cellW - 8 - vW) / 2,
      y: gridY - 42,
      size: 14,
      font: fontBold,
      color: rgb(0.114, 0.114, 0.122),
    })
  })

  // ─── Signature ────────────────────────────────────────────────────────────
  const sigX = 80
  const sigY = gridY - 80

  page.drawText('Fábio Borges', {
    x: sigX,
    y: sigY + 12,
    size: 22,
    font: fontOblique,
    color: rgb(0.114, 0.114, 0.122),
  })
  // Underline
  const sigW = fontOblique.widthOfTextAtSize('Fábio Borges', 22)
  page.drawLine({
    start: { x: sigX, y: sigY + 8 },
    end: { x: sigX + sigW, y: sigY + 8 },
    thickness: 1.5,
    color: rgb(0.114, 0.114, 0.122),
  })
  page.drawText('Mentor · Fábio Borges Mentoria', {
    x: sigX,
    y: sigY - 4,
    size: 9,
    font: fontReg,
    color: rgb(0.56, 0.56, 0.56),
  })

  // ─── QR Code ──────────────────────────────────────────────────────────────
  try {
    const qrUrl = `${ORIGIN}/certificado/${data.uuid}`
    const qrBuffer = await QRCode.toBuffer(qrUrl, {
      width: 80,
      margin: 1,
      errorCorrectionLevel: 'M',
    })
    const qrImage = await pdfDoc.embedPng(qrBuffer)
    const qrSize = 80

    page.drawImage(qrImage, {
      x: PAGE_W - qrSize - 80,
      y: sigY - 8,
      width: qrSize,
      height: qrSize,
    })

    const verifyLabel = 'Verificar autenticidade'
    const verifyW = fontReg.widthOfTextAtSize(verifyLabel, 8)
    page.drawText(verifyLabel, {
      x: PAGE_W - 80 - (verifyW - qrSize) / 2 - 80,
      y: sigY - 16,
      size: 8,
      font: fontReg,
      color: rgb(0.56, 0.56, 0.56),
    })
  } catch {
    // QR Code opcional — não bloqueia geração do certificado
  }

  // ─── Footer: verification code ────────────────────────────────────────────
  const shortCode = `MB-${data.issuedAt.getFullYear()}-${data.uuid.slice(0, 6).toUpperCase()}`
  const footerText = `Código de verificação: ${shortCode} · ${ORIGIN}/certificado/${data.uuid}`
  const footerW = fontReg.widthOfTextAtSize(footerText, 7.5)
  page.drawText(footerText, {
    x: (PAGE_W - footerW) / 2,
    y: margin + 10,
    size: 7.5,
    font: fontReg,
    color: rgb(0.68, 0.68, 0.68),
  })

  return pdfDoc.save()
}

// ─── Upload to Supabase Storage ────────────────────────────────────────────

export async function uploadCertificatePdf(
  pdfBytes: Uint8Array,
  userId: string,
  uuid: string
): Promise<string | null> {
  try {
    const supabase = createClient()
    const path = `${userId}/${uuid}.pdf`

    const { error } = await supabase.storage
      .from('certificates')
      .upload(path, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (error) return null

    const { data: signed } = await supabase.storage
      .from('certificates')
      .createSignedUrl(path, 60 * 60 * 24 * 365) // 1 year

    return signed?.signedUrl ?? null
  } catch {
    return null
  }
}
