# 6. Fluxos Críticos

## Fluxo 1 — Compra de curso avulso

1. Visitante acessa `/cursos/radiofrequencia` — página de venda com descrição, módulos, preço, CTA
2. Clica "Comprar agora" → POST `/api/checkout/curso` → redirect para Stripe
3. Pagamento via cartão parcelado ou PIX → redirect para `/checkout/sucesso`
4. Webhook `checkout.session.completed` → verifica HMAC → INSERT `enrollments` no Supabase
5. Email automático Resend — "Acesso liberado" com link direto ao curso
6. Aluno acessa `/dashboard/curso/radiofrequencia` → RLS valida matrícula automaticamente

## Fluxo 2 — Assinatura de plano

1. Prospect acessa `/planos` — cards com benefícios e preços
2. Escolhe "Plano Prata" → Stripe Subscription Checkout
3. Webhook `customer.subscription.created` → upserta `subscriptions` → role "mentorado_prata"
4. RLS libera acesso a todos os cursos do plano — zero intervenção manual
5. Renovação automática mensal via webhook `invoice.paid`
6. Falha de pagamento → período de graça 3 dias → email + revogação automática após 3 dias

## Fluxo 3 — Conclusão e certificado

1. Aluno marca última aula como concluída → POST `/api/progress`
2. Sistema verifica nota mínima (70%) na prova final
3. `enrollment.status = 'completed'` → Edge Function dispara geração do certificado (assíncrona)
4. `pdf-lib` gera PDF com UUID único + assinatura Fábio Borges + QR Code → Supabase Storage
5. Email Resend — "Seu certificado está pronto" com link de download

---
