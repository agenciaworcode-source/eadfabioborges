# 10. Arquitetura Frontend

## 10.1 Estrutura de Componentes (App Router)

```
src/
├── app/                          # Next.js App Router
│   ├── (public)/                 # Route group: sem layout de auth
│   │   ├── page.tsx              # Landing /
│   │   ├── cursos/
│   │   │   ├── page.tsx          # /cursos
│   │   │   └── [slug]/page.tsx   # /cursos/[slug]
│   │   ├── planos/page.tsx       # /planos
│   │   └── certificado/[uuid]/page.tsx
│   ├── (auth)/                   # Route group: páginas de auth
│   │   └── auth/
│   │       ├── login/page.tsx
│   │       ├── cadastro/page.tsx
│   │       └── recuperar-senha/page.tsx
│   ├── (dashboard)/              # Route group: layout com sidebar
│   │   ├── layout.tsx            # Sidebar + header autenticado
│   │   └── dashboard/
│   │       ├── page.tsx          # /dashboard
│   │       ├── perfil/page.tsx
│   │       ├── plano/page.tsx
│   │       ├── certificados/page.tsx
│   │       └── curso/[id]/page.tsx
│   ├── (admin)/                  # Route group: layout admin
│   │   ├── layout.tsx            # Sidebar admin
│   │   └── admin/
│   │       ├── page.tsx
│   │       ├── alunos/page.tsx
│   │       ├── cursos/page.tsx
│   │       ├── tarefas/[id]/page.tsx
│   │       └── relatorios/page.tsx
│   ├── api/                      # API Routes (BFF)
│   │   ├── checkout/
│   │   │   ├── curso/route.ts
│   │   │   ├── plano/route.ts
│   │   │   └── pix/route.ts
│   │   ├── webhooks/
│   │   │   ├── stripe/route.ts
│   │   │   └── mercadopago/route.ts
│   │   ├── progress/route.ts
│   │   ├── quiz/submit/route.ts
│   │   ├── assignment/upload/route.ts
│   │   ├── certificate/generate/route.ts
│   │   └── health/route.ts
│   ├── layout.tsx                # Root layout: providers, fonts
│   └── globals.css
├── components/
│   ├── ui/                       # shadcn/ui atoms (Button, Input, Badge...)
│   ├── course/                   # CourseCard, LessonRow, ModuleAccordion
│   ├── player/                   # VimeoPlayer, ProgressBar
│   ├── quiz/                     # Quiz, QuizResult
│   ├── assignment/               # AssignmentUpload
│   ├── certificate/              # CertificateCard, CertificateVerify
│   ├── checkout/                 # CheckoutCard, PlanCard
│   ├── layout/                   # Header, Sidebar, Footer, BottomNav
│   └── shared/                   # AccessGate, LoadingSkeleton, EmptyState
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # createBrowserClient (singleton)
│   │   └── server.ts             # createServerClient (per-request)
│   ├── stripe.ts                 # Stripe client (server-only)
│   ├── mercadopago.ts            # MP client (server-only)
│   ├── resend.ts                 # Resend client
│   ├── certificate-generator.ts  # pdf-lib + qrcode
│   └── validations/              # Zod schemas compartilhados
│       ├── checkout.ts
│       ├── progress.ts
│       └── quiz.ts
├── emails/                       # React Email templates
│   ├── acesso-liberado.tsx
│   ├── boas-vindas.tsx
│   ├── certificado-pronto.tsx
│   ├── lembrete-inatividade.tsx
│   └── falha-pagamento.tsx
├── types/
│   └── database.ts               # Tipos gerados pelo Supabase CLI
├── hooks/
│   ├── use-auth.ts               # useUser, useSession
│   ├── use-progress.ts           # progresso de aulas
│   └── use-enrollment.ts         # status de matrícula
└── middleware.ts                  # Auth guard para /dashboard e /admin
```

## 10.2 Padrão de Server vs Client Component

```typescript
// REGRA: default = Server Component
// EXCEÇÃO: use 'use client' apenas quando necessário

// ✅ Server Component (default) — dados estáticos/públicos
// app/(public)/cursos/[slug]/page.tsx
export default async function CoursePage({ params }) {
  const supabase = createServerClient()
  const { data: course } = await supabase
    .from('courses')
    .select('*, modules(*, lessons(*))')
    .eq('slug', params.slug)
    .single()
  return <CourseLanding course={course} />
}

// ✅ Client Component — interatividade obrigatória
// components/player/VimeoPlayer.tsx
'use client'
export function VimeoPlayer({ vimeoId, lessonId, onComplete }) {
  // player interativo, estado local, eventos de progresso
}
```

## 10.3 State Management

```typescript
// Zustand: apenas estado global que cruza múltiplos componentes

// stores/auth-store.ts
import { create } from 'zustand'
interface AuthStore {
  user: User | null
  setUser: (user: User | null) => void
}
export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}))

// TanStack Query: para dados do servidor com cache
// hooks/use-progress.ts
export function useCourseProgress(courseId: string) {
  return useQuery({
    queryKey: ['progress', courseId],
    queryFn: () => fetch(`/api/progress/${courseId}`).then((r) => r.json()),
    staleTime: 30_000, // 30s — sincronizado com auto-save interval
  })
}
```

## 10.4 Middleware (Auth Guard)

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const supabase = createServerClient(/* cookies */)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')
  const isAdmin = request.nextUrl.pathname.startsWith('/admin')

  if ((isDashboard || isAdmin) && !user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('returnUrl', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAdmin) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user!.id)
      .single()
    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
}
```

---
