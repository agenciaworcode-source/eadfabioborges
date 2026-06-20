# 6. Componentes do Sistema

## 6.1 Next.js App (Frontend + BFF)

**Responsabilidade:** Interface do usuário + orquestração de serviços externos
**Interfaces principais:**

- Renderização de páginas (SSR/SSG/CSR conforme rota)
- API routes como BFF para Stripe, Supabase, Resend
- Server Components para dados sem interatividade
- Client Components para player, quiz, upload

**Dependências:** Supabase JS, Stripe SDK, MercadoPago SDK, Resend SDK, pdf-lib

---

## 6.2 Supabase (Data Layer)

**Responsabilidade:** Banco de dados, autenticação, storage
**Interfaces:**

- `@supabase/supabase-js` client (browser + server)
- `@supabase/ssr` para cookies no App Router
- RLS policies como camada de autorização
- Edge Functions para triggers assíncronos (certificados)

**Instâncias:**

- `createBrowserClient()` → componentes client-side
- `createServerClient()` → Server Components e API routes (usa cookies)

---

## 6.3 Stripe (Pagamentos)

**Responsabilidade:** Checkout, assinaturas recorrentes, webhooks
**Interfaces:**

- `stripe.checkout.sessions.create()` → redirect para Stripe
- `stripe.webhooks.constructEvent()` → verificação HMAC obrigatória
- `stripe.subscriptions.*` → gestão de assinaturas

---

## 6.4 Gerador de Certificados (Local)

**Responsabilidade:** Gerar PDF + QR Code de forma assíncrona
**Localização:** `src/lib/certificate-generator.ts`
**Dependências:** `pdf-lib`, `qrcode`, Supabase Storage
**Trigger:** Edge Function Supabase ou POST /api/certificate/generate

```mermaid
sequenceDiagram
    participant EF as Edge Function
    participant API as /api/certificate/generate
    participant GEN as certificate-generator.ts
    participant ST as Supabase Storage
    participant DB as PostgreSQL

    EF->>API: POST com enrollmentId
    API->>DB: Verifica enrollment.status = completed + quiz >= 70%
    API->>GEN: generateCertificate(user, course, uuid)
    GEN->>GEN: pdf-lib: monta PDF (template escuro/dourado)
    GEN->>GEN: qrcode: gera QR Code com URL verificação
    GEN->>GEN: Insere assinatura PNG Fábio Borges
    GEN->>ST: Upload PDF → /certificates/{uuid}.pdf
    ST->>GEN: { publicUrl }
    GEN->>DB: INSERT certificates { id: uuid, pdf_url, verified: true }
    API->>API: Dispara email via Resend (certificado pronto)
```

---

## 6.5 Diagrama de Componentes

```mermaid
graph LR
    subgraph "Browser"
        RC["React Client Components\n(player, quiz, forms)"]
        RS["React Server Components\n(catálogo, dashboard, perfil)"]
    end

    subgraph "Next.js Server (VPS)"
        AR["App Router\n/app/*"]
        API["API Routes\n/app/api/*"]
        MW["Middleware\n(auth guard)"]
        CERT["Certificate Generator\npdf-lib + qrcode"]
    end

    subgraph "Supabase"
        SBDB[("PostgreSQL\n+ RLS")]
        SBAUTH["Auth Service"]
        SBSTORE["Storage\n(PDFs, uploads)"]
        SBEDGE["Edge Functions\n(triggers)"]
    end

    RC --> AR
    RS --> AR
    AR --> MW
    AR --> API
    API --> SBDB
    API --> SBAUTH
    API --> CERT
    CERT --> SBSTORE
    SBEDGE --> API
    MW --> SBAUTH
```

---
