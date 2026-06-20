# 5. API Specification (REST)

## 5.1 Endpoints — Autenticação

Delegada inteiramente ao Supabase Auth SDK. Sem API routes customizadas para auth básica.

```
Supabase Client (client-side):
  supabase.auth.signInWithPassword()
  supabase.auth.signInWithOAuth({ provider: 'google' })
  supabase.auth.signUp()
  supabase.auth.resetPasswordForEmail()
  supabase.auth.signOut()
```

## 5.2 Endpoints — Checkout

```yaml
POST /api/checkout/curso
  Body: { courseId: string }
  Auth: Requer sessão ativa
  Response: { url: string }  # URL do Stripe Checkout Session
  Errors: 400 (course not found), 401 (not authenticated), 500

POST /api/checkout/plano
  Body: { plan: 'prata' | 'ouro' | 'diamante' }
  Auth: Requer sessão ativa
  Response: { url: string }  # URL do Stripe Subscription Checkout
  Errors: 400, 401, 500

POST /api/checkout/pix
  Body: { courseId?: string; plan?: string; amount: number }
  Auth: Requer sessão ativa
  Response: { preferenceId: string; initPoint: string; qrCode: string }
```

## 5.3 Endpoints — Webhooks

```yaml
POST /api/webhooks/stripe
  Headers: stripe-signature (HMAC verificado OBRIGATÓRIO)
  Body: Stripe Event (raw body — não parsear antes da verificação)
  Eventos tratados:
    - checkout.session.completed → criar enrollment ou subscription
    - customer.subscription.updated → atualizar status
    - customer.subscription.deleted → cancelar subscription
    - invoice.payment_failed → iniciar período de graça
    - invoice.paid → renovar period_end
  Response: { received: true } (sempre 200 para Stripe, erros logados internamente)
  Idempotência: checar stripe_event_id antes de processar

POST /api/webhooks/mercadopago
  Headers: x-signature (verificação MercadoPago)
  Body: MercadoPago notification
  Response: { received: true }
```

## 5.4 Endpoints — Progresso e Quiz

```yaml
POST /api/progress
  Body: { lessonId: string; watchedSecs: number; completed?: boolean }
  Auth: Requer sessão + enrollment/subscription ativa (verificado via RLS)
  Response: { updated: true }
  Notas: Chamado a cada 30s pelo VimeoPlayer. Upsert em lesson_progress.

GET /api/progress/:courseId
  Auth: Requer sessão
  Response: { lessons: { [lessonId]: { completed, watchedSecs } } }

POST /api/quiz/submit
  Body: { quizId: string; answers: Record<string, string> }
  Auth: Requer sessão + acesso à aula
  Response: { score: number; passed: boolean; correctAnswers?: Record<string,string> }
  Notas: Verifica attempts_allowed antes de aceitar nova tentativa
```

## 5.5 Endpoints — Upload de Tarefas

```yaml
POST /api/assignment/upload
  Body: FormData { assignmentId: string; file: File (max 50MB) }
  Auth: Requer sessão + acesso à aula
  Content-Type: multipart/form-data
  Response: { submissionId: string; fileUrl: string }
  Validação (Zod): tipo de arquivo (PDF/img/ZIP), tamanho máx 50MB

GET /api/assignment/:submissionId
  Auth: Próprio aluno ou admin
  Response: { submission: Submission }
```

## 5.6 Endpoints — Certificados

```yaml
POST /api/certificate/generate
  Body: { enrollmentId: string }
  Auth: Admin apenas
  Response: { certificateId: string; pdfUrl: string }
  Notas: Trigger manual para admin. Geração automática via Edge Function.

GET /api/health
  Auth: Público
  Response: { status: 'ok'; uptime: number; version: string }
  Uso: CI/CD health check + UptimeRobot
```

---
