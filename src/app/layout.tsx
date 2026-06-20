import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import { QueryProvider } from '@/components/providers/QueryProvider'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Mentoria Fábio Borges — Plataforma EAD',
  description: 'Plataforma de ensino a distância para profissionais de saúde estética.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={dmSans.variable}>
      <body style={{ fontFamily: 'var(--font-dm-sans), "DM Sans", -apple-system, sans-serif' }}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}
