import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ─── Rate Limiter simples por IP (in-memory, reset a cada janela) ────────────
// Suficiente para Next.js com deploy monolítico (VPS/Vercel single-region).
// Para multi-região, substituir por Redis/Upstash.
const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minuto
const RATE_LIMIT_MAX: Record<string, number> = {
  '/api/checkout': 10, // 10 checkouts/min por IP
  '/api/webhooks': 60, // webhooks do Stripe/MP — permitir retries
  '/auth/login': 20, // 20 tentativas de login/min por IP
  '/auth/cadastro': 10, // 10 cadastros/min por IP
}

const rateMap = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string, prefix: string): boolean {
  const limit = RATE_LIMIT_MAX[prefix]
  if (!limit) return false

  const key = `${ip}:${prefix}`
  const now = Date.now()
  const entry = rateMap.get(key)

  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }

  entry.count++
  if (entry.count > limit) return true

  return false
}

function getRateLimitPrefix(pathname: string): string | null {
  for (const prefix of Object.keys(RATE_LIMIT_MAX)) {
    if (pathname.startsWith(prefix)) return prefix
  }
  return null
}
// ─────────────────────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // Rate limiting — rotas sensíveis
  const pathname = request.nextUrl.pathname
  const prefix = getRateLimitPrefix(pathname)
  if (prefix) {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      '127.0.0.1'

    if (isRateLimited(ip, prefix)) {
      return NextResponse.json(
        { error: 'Muitas requisições. Tente novamente em instantes.' },
        { status: 429 }
      )
    }
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isDashboard = pathname.startsWith('/dashboard')
  const isAdmin = pathname.startsWith('/admin')

  if ((isDashboard || isAdmin) && !user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('returnUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAdmin && user) {
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path*',
    '/admin',
    '/admin/:path*',
    '/api/checkout/:path*',
    '/api/webhooks/:path*',
    '/auth/login',
    '/auth/cadastro',
  ],
}
