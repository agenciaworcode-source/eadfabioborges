import { Resend } from 'resend'
import type { ReactElement } from 'react'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM = 'Mentoria Fábio Borges <noreply@ead.fabioborgesoficial.com.br>'

export async function sendEmail(
  to: string,
  subject: string,
  react: ReactElement,
): Promise<void> {
  if (!resend) {
    console.warn('[resend] RESEND_API_KEY not set — email not sent:', subject)
    return
  }
  const { error } = await resend.emails.send({ from: FROM, to, subject, react })
  if (error) console.error('[resend] send error:', error)
}
