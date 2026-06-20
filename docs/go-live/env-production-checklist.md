# Variáveis de Ambiente — Produção EAD Fábio Borges

Configure todas as variáveis abaixo no painel de deploy (Vercel / VPS).
**NUNCA commite valores reais no repositório.**

---

## Supabase

| Variável                        | Descrição                                       | Exemplo                    |
| ------------------------------- | ----------------------------------------------- | -------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | URL do projeto Supabase                         | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon/public                               | `eyJ...`                   |
| `SUPABASE_SERVICE_ROLE_KEY`     | Chave service role (SECRETA — server-side only) | `eyJ...`                   |

> Obter em: Supabase Dashboard → Settings → API

---

## Stripe

| Variável                             | Descrição                  | Dev              | Prod             |
| ------------------------------------ | -------------------------- | ---------------- | ---------------- |
| `STRIPE_SECRET_KEY`                  | Chave secreta Stripe       | `sk_test_...`    | `sk_live_...`    |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Chave pública              | `pk_test_...`    | `pk_live_...`    |
| `STRIPE_WEBHOOK_SECRET`              | Secret do webhook endpoint | `whsec_test_...` | `whsec_live_...` |
| `CHECKOUT_PROVIDER`                  | Provider ativo             | `stub`           | `stripe`         |

### Price IDs (criar no Stripe Dashboard → Products)

| Variável                        | Plano    | Período |
| ------------------------------- | -------- | ------- |
| `STRIPE_PRICE_PRATA_MONTHLY`    | Prata    | Mensal  |
| `STRIPE_PRICE_PRATA_ANNUAL`     | Prata    | Anual   |
| `STRIPE_PRICE_OURO_MONTHLY`     | Ouro     | Mensal  |
| `STRIPE_PRICE_OURO_ANNUAL`      | Ouro     | Anual   |
| `STRIPE_PRICE_DIAMANTE_MONTHLY` | Diamante | Mensal  |
| `STRIPE_PRICE_DIAMANTE_ANNUAL`  | Diamante | Anual   |

> Registrar webhook em: Stripe Dashboard → Developers → Webhooks
> URL: `https://ead.fabioborgesoficial.com.br/api/webhooks/stripe`
> Eventos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

---

## MercadoPago (PIX)

| Variável                     | Descrição                         | Exemplo       |
| ---------------------------- | --------------------------------- | ------------- |
| `MERCADOPAGO_ACCESS_TOKEN`   | Access token de produção          | `APP_USR-...` |
| `MERCADOPAGO_WEBHOOK_SECRET` | Secret para validação x-signature | `...`         |

> URL webhook: `https://ead.fabioborgesoficial.com.br/api/webhooks/mercadopago`

---

## Resend (Email)

| Variável         | Descrição         |
| ---------------- | ----------------- |
| `RESEND_API_KEY` | API key do Resend |

> Verificar domínio de envio no Resend Dashboard.

---

## Cron / Automações

| Variável      | Descrição                                   |
| ------------- | ------------------------------------------- |
| `CRON_SECRET` | Secret para autenticar chamadas de cron job |

---

## App

| Variável              | Dev                     | Prod                                    |
| --------------------- | ----------------------- | --------------------------------------- |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `https://ead.fabioborgesoficial.com.br` |

---

## Checklist de validação pós-deploy

- [ ] `GET /api/health` retorna `{ status: 'ok' }`
- [ ] Criar conta de teste → email de confirmação chega
- [ ] Checkout Stripe sandbox funciona (cartão `4242 4242 4242 4242`)
- [ ] Webhook Stripe registrado e testado (`stripe trigger checkout.session.completed`)
- [ ] UptimeRobot configurado para `/api/health` com alerta por WhatsApp/email
- [ ] Backups do Supabase ativos (Settings → Database → Backups)
