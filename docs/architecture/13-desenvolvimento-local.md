# 13. Desenvolvimento Local

## 13.1 Pré-requisitos

```bash
node --version  # >= 22.x LTS
npm --version   # >= 10.x
git --version   # >= 2.30
# Supabase CLI
npx supabase --version  # >= 1.x
# Stripe CLI (para webhooks locais)
stripe --version
```

## 13.2 Setup Inicial

```bash
# Clone e dependências
git clone git@github.com:SEU_ORG/ead-fabioborges.git
cd ead-fabioborges
npm install

# Variáveis de ambiente
cp .env.example .env
# Preencher: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
# STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PUBLISHABLE_KEY
# MP_ACCESS_TOKEN, RESEND_API_KEY, NEXT_PUBLIC_URL

# Supabase local
npx supabase start          # Inicia PostgreSQL local via Docker
npx supabase db reset       # Aplica migrations + seed

# Stripe webhooks locais
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## 13.3 Comandos de Desenvolvimento

```bash
# Servidor de desenvolvimento
npm run dev           # Next.js dev server em localhost:3000

# Qualidade de código
npm run lint          # ESLint
npm run typecheck     # tsc --noEmit
npm run format        # Prettier

# Testes
npm run test          # Vitest (unit + integration)
npm run test:e2e      # Playwright (requer servidor rodando)

# Build de produção
npm run build
npm run start

# Banco de dados
npx supabase gen types typescript --local > src/types/database.ts
npx supabase db diff  # Ver diff pendente
npx supabase db push  # Aplicar em produção
```

## 13.4 Variáveis de Ambiente

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # Server-only — nunca expor ao client

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY= # Exposto ao client (prefixo NEXT_PUBLIC_)
STRIPE_SECRET_KEY=                   # Server-only
STRIPE_WEBHOOK_SECRET=               # Server-only

# MercadoPago
MP_ACCESS_TOKEN=                     # Server-only

# Resend
RESEND_API_KEY=                      # Server-only

# App
NEXT_PUBLIC_URL=https://ead.fabioborgesoficial.com.br

# Node
NODE_ENV=production
```

---
