# 7. APIs Externas

## 7.1 Stripe

- **Propósito:** Checkout de cursos avulsos e assinaturas recorrentes
- **Documentação:** https://stripe.com/docs/api
- **Base URL:** `https://api.stripe.com/v1`
- **Auth:** Secret Key via `STRIPE_SECRET_KEY` (server-only)
- **Rate Limits:** 100 req/s (mais que suficiente)
- **Endpoints usados:**
  - `POST /checkout/sessions` — criar sessão de checkout
  - `POST /billing/subscriptions` — gerenciar assinaturas
  - `POST /webhooks` (recebe) — eventos de pagamento
- **Nota crítica:** Verificar `stripe-signature` HMAC em TODOS os webhooks. Usar raw body (não parseado).

## 7.2 MercadoPago

- **Propósito:** PIX brasileiro
- **Documentação:** https://www.mercadopago.com.br/developers/pt/docs
- **Base URL:** `https://api.mercadopago.com`
- **Auth:** Access Token via `MP_ACCESS_TOKEN`
- **Endpoints usados:**
  - `POST /checkout/preferences` — criar preferência de pagamento PIX
  - Webhook recebe notificações de pagamento aprovado
- **Nota:** Verificar assinatura do webhook via `x-signature` header

## 7.3 Supabase

- **Propósito:** Database, Auth, Storage
- **SDK:** `@supabase/supabase-js` v2 + `@supabase/ssr`
- **Padrão Server Component:**
  ```typescript
  import { createServerClient } from '@supabase/ssr'
  // Usa cookies() do Next.js para sessão server-side
  ```
- **Padrão Client Component:**
  ```typescript
  import { createBrowserClient } from '@supabase/ssr'
  // Singleton para evitar múltiplas instâncias
  ```

## 7.4 Vimeo oEmbed

- **Propósito:** Embed de aulas com proteção por domínio
- **Base URL:** `https://vimeo.com/api/oembed.json`
- **Auth:** Não requer auth para oEmbed público (configurar domínios permitidos no Vimeo Pro)
- **Endpoint:** `GET https://vimeo.com/api/oembed.json?url=https://vimeo.com/{id}&color=b8860b`
- **Nota:** Configurar no painel Vimeo: domínios permitidos = `ead.fabioborgesoficial.com.br` + `staging.fabioborgesoficial.com.br`

## 7.5 Resend

- **Propósito:** Emails transacionais (boas-vindas, certificados, lembretes)
- **SDK:** `resend` npm package
- **Auth:** `RESEND_API_KEY`
- **From:** `no-reply@fabioborgesoficial.com.br` (domínio próprio com SPF/DKIM/DMARC)
- **Templates:** React Email em `src/emails/*.tsx`

---
