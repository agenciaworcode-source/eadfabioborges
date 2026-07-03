# Análise de Gaps Operacionais — Plataforma EAD Fábio Borges

> **Documento de contexto técnico.** Análise profunda de ponta a ponta cobrindo Segurança, Infraestrutura, Performance, Operação e Dívida Técnica.
> **Data:** 2026-07-03 · **Status:** Sprint 0 em execução · **Autor:** Análise assistida (Claude)
> **Escopo:** `middleware.ts`, rotas `src/app/api/**`, RLS em `supabase/migrations/**`, config de deploy (`vercel.json`, `.github/workflows/deploy.yml`), estratégia de cache das páginas.

## 📋 Progresso de execução (atualizado 2026-07-03)

**Deploy confirmado: Vercel** → o gap **I1 (crons) deixa de ser crítico**: os crons do `vercel.json` disparam nativamente. O `deploy.yml` (VPS/SSH) está obsoleto e deve ser removido ou alinhado (rebaixado para 🟢 baixo, Sprint 2). Resta garantir que os endpoints de cron recebam o `CRON_SECRET` que o Vercel Cron envia.

| Item                       | Status                                                                                                                 | Nota                                              |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| S1 (escalação de role)     | ✅ **RESOLVIDO** — migration aplicada em prod + re-teste confirma bloqueio (role/plan travados, perfil ainda editável) | `20260703000001_prevent_role_self_escalation.sql` |
| S2 (service key no Git)    | ✅ Arquivo removido do tracking + `.gitignore` · ⚠️ **falta rotacionar a chave** (dashboard) e expurgar histórico      | Chave ainda no histórico do commit inicial        |
| S3 (webhook forjável)      | ✅ Código fail-closed em produção + comparação time-safe · ⚠️ **falta setar `PAGARME_WEBHOOK_SECRET`**                 | `webhooks/pagarme/route.ts`                       |
| S4 (chave prod em sandbox) | ✅ Guarda de coerência chave×env adicionada · ⚠️ config real é do usuário                                              | `providers/pagarme.ts`                            |
| I1 (crons)                 | ✅ Resolvido (deploy Vercel)                                                                                           | —                                                 |

**Ações que só o dono pode fazer (bloqueiam fechamento do Sprint 0):**

1. Rotacionar a `service_role key` no dashboard Supabase (S2).
2. Setar `PAGARME_WEBHOOK_SECRET` no dashboard PagarMe + env da Vercel (S3).
3. Aplicar a migration S1 (SQL Editor ou `db push`).
4. Ajustar chaves PagarMe sandbox/produção conforme ambiente (S4).

---

## 1. Sumário executivo

A plataforma está **funcionalmente sólida** — o QA de usabilidade (53/53) confirmou que os fluxos de aluno, admin, carrinho, progresso, prova e certificado operam sem erros. O risco **não está na feature**, está na **postura operacional e de segurança**.

Há **3 vulnerabilidades críticas** que, isoladamente, comprometem a integridade da plataforma em produção:

1. **Escalação de privilégio via RLS** — qualquer aluno logado pode se tornar admin.
2. **Vazamento da `service_role key`** — arquivo com a chave-mestra do banco está versionado no Git.
3. **Webhook de pagamento sem verificação de assinatura** — qualquer um pode forjar um pagamento e ganhar acesso grátis.

Nenhuma das três exige ferramenta sofisticada para ser explorada — bastam `curl` e as credenciais que já estão no repositório. **Recomendação: tratar o Sprint 0 (abaixo) como bloqueador de operação antes de qualquer divulgação ampla da plataforma.**

Além dos críticos, há gaps relevantes de **infraestrutura operacional** (crons que podem não estar rodando, ausência de observabilidade, ausência de ambiente de staging) e de **dívida técnica** (código morto de gateways não usados, tipagem mascarada, rate limiter frágil).

### Matriz de severidade

| ID  | Domínio      | Severidade | Gap                                                       | Sprint |
| --- | ------------ | ---------- | --------------------------------------------------------- | ------ |
| S1  | Segurança    | 🔴 Crítico | RLS `users_update_own` permite virar admin                | 0      |
| S2  | Segurança    | 🔴 Crítico | `supabasecloud.md` com service_role key no Git            | 0      |
| S3  | Segurança    | 🔴 Crítico | `PAGARME_WEBHOOK_SECRET` vazio → webhook forjável         | 0      |
| S4  | Segurança    | 🟠 Alto    | Chaves PagarMe de produção em ambiente "sandbox"          | 0      |
| I1  | Infra        | 🟠 Alto    | Crons definidos no Vercel mas deploy é em VPS             | 1      |
| S5  | Segurança    | 🟡 Médio   | Rate limiter in-memory (inútil multi-instância + leak)    | 1      |
| S6  | Segurança    | 🟡 Médio   | Cadastro aberto sem captcha (abuso/spam)                  | 1      |
| I2  | Infra        | 🟡 Médio   | Sem observabilidade (Sentry/logs/alertas)                 | 1      |
| I3  | Infra        | 🟡 Médio   | Sem ambiente de staging; migrations testadas em prod      | 2      |
| I4  | Infra        | 🟡 Médio   | Backup/PITR do Supabase não confirmado                    | 2      |
| O1  | Operação     | 🟡 Médio   | 3 gateways de pagamento no código, só 1 usado (dead code) | 3      |
| P1  | Performance  | 🟢 Baixo   | Middleware chama `getUser()` em webhooks (latência)       | 3      |
| D1  | Dívida técn. | 🟢 Baixo   | Tipagem Supabase mascarada com `as never`/`as unknown`    | 3      |
| I5  | Infra        | 🟢 Baixo   | `FULL_SETUP.sql` duplica migrations (risco de drift)      | 2      |

---

## 2. Gaps de Segurança

### 🔴 S1 — Escalação de privilégio via RLS (CRÍTICO)

**Onde:** `supabase/migrations/20260101000006_rls_policies.sql:73`

```sql
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (id = auth.uid());
```

**Problema:** a policy autoriza o usuário a atualizar a própria linha, mas **não tem cláusula `WITH CHECK`** restringindo _quais colunas_ podem mudar. A coluna `role` tem `CHECK (role IN ('student','admin'))` — ou seja, `'admin'` é um valor válido.

**Vetor de ataque:** um aluno autenticado, usando a própria `anon key` (que é pública, embarcada no frontend), faz:

```
PATCH /rest/v1/users?id=eq.<seu_id>   Body: { "role": "admin" }
```

A RLS aprova (`id = auth.uid()`), o `CHECK` aprova (`'admin'` é válido), e o usuário **vira admin**. A partir daí tem acesso total ao painel `/admin`, pode criar/deletar cursos, matricular-se em tudo, ver dados de todos os alunos.

> ⚠️ **Não confirmado por execução** (a pedido — nenhum teste rodado), mas a leitura da policy + constraint torna o vetor altamente provável. **Validar em staging** com um usuário `student` de teste antes de aplicar o fix.

**Correção proposta (Sprint 0):** adicionar `WITH CHECK` que impeça mudança de `role` (e outras colunas sensíveis como `plan`), ou bloquear a coluna `role` via trigger `BEFORE UPDATE` que rejeite alteração quando `auth.uid()` não for admin. A gestão de role deve ser exclusiva de rota admin usando `service_role`.

---

### 🔴 S2 — Vazamento da service_role key no Git (CRÍTICO)

**Onde:** `supabasecloud.md` (arquivo **versionado** — confirmado via `git ls-files`).

**Problema:** o arquivo contém, em texto claro, a `SUPABASE_SERVICE_ROLE_KEY`, a `anon key` e o `project-ref`. A `service_role key` **ignora todas as RLS** — quem a tiver tem acesso irrestrito de leitura/escrita/deleção a todo o banco (dados de alunos, pagamentos, tudo).

**Agravante:** mesmo que o arquivo seja removido agora, a chave **permanece no histórico do Git** e pode já ter sido clonada. Remover o arquivo não é suficiente.

**Correção proposta (Sprint 0):**

1. **Rotacionar** a `service_role key` no dashboard do Supabase (invalida a vazada).
2. Remover `supabasecloud.md` do repositório e adicioná-lo ao `.gitignore`.
3. Reescrever histórico (`git filter-repo` ou BFG) para expurgar a chave, **ou** — se o histórico não puder ser reescrito — considerar a chave permanentemente comprometida e confiar na rotação.
4. Mover credenciais para um gerenciador de segredos (variáveis de ambiente do host / Vercel env / cofre).

---

### 🔴 S3 — Webhook de pagamento sem verificação de assinatura (CRÍTICO)

**Onde:** `src/app/api/webhooks/pagarme/route.ts:33-43` + env `PAGARME_WEBHOOK_SECRET` (vazio).

**Problema:** quando `PAGARME_WEBHOOK_SECRET` não está setado, a função `verifySignature` **retorna `true`** (aceita qualquer requisição). Isso foi _comprovado no teste anterior_: uma matrícula e uma assinatura foram criadas forjando um `order.paid` sem nenhuma credencial.

**Vetor de ataque:** qualquer pessoa faz `POST /api/webhooks/pagarme` com um corpo `{ "type":"order.paid", "data": { "metadata": { "type":"plan", "planId":"diamante", ... } } }` e **ganha acesso a qualquer plano/curso sem pagar**.

**Correção proposta (Sprint 0):** configurar `PAGARME_WEBHOOK_SECRET` no dashboard do PagarMe e no ambiente. **Adicionalmente**, mudar o `fail-open` para `fail-closed`: se o secret não estiver configurado em produção, o webhook deve **rejeitar** (não aceitar). O comportamento atual "aceita sem verificação (dev only)" é perigoso porque um esquecimento de config vira porta aberta.

---

### 🟠 S4 — Chaves PagarMe de produção em ambiente "sandbox" (ALTO)

**Onde:** `.env.local` — `PAGARME_API_KEY=sk_...` (produção, sem prefixo `_test_`) com `PAGARME_ENV=sandbox`.

**Problema:** inconsistência perigosa. Todo teste de checkout cria **cobranças reais**. Além do risco financeiro, impede validar o fluxo de cartão de ponta a ponta (o adquirente real recusa cartões de teste).

**Correção proposta (Sprint 0):** separar claramente chaves de teste (dashboard sandbox PagarMe) das de produção, e garantir que `PAGARME_ENV` reflita a chave em uso. Idealmente, validar na inicialização que o prefixo da chave bate com o `PAGARME_ENV`.

---

### 🟡 S5 — Rate limiter in-memory (MÉDIO)

**Onde:** `middleware.ts:15-34`.

**Problema:** o `Map` de rate limiting vive na memória do processo. Dois efeitos:

- **Ineficaz em múltiplas instâncias** — cada instância tem seu próprio contador; o limite real vira `N × limite`.
- **Reset a cada deploy/restart** — o estado é perdido.
- **Memory leak** — o `Map` só cresce; entradas expiradas nunca são removidas (não há eviction), apenas sobrescritas se a mesma chave voltar. IPs únicos acumulam indefinidamente.

**Correção proposta (Sprint 1):** migrar para um store compartilhado com TTL (Upstash Redis / Vercel KV via Marketplace). Se mantiver in-memory no curto prazo, ao menos adicionar limpeza periódica das entradas expiradas.

---

### 🟡 S6 — Cadastro aberto sem captcha (MÉDIO)

**Onde:** `src/app/api/auth/cadastro/route.ts`.

**Problema:** o endpoint cria usuários via `service_role` (`admin.createUser`) com email já confirmado. Está protegido por rate limit de 10/min por IP, mas sem captcha/prova de trabalho. Um atacante distribuído pode inflar a tabela `users`, disparar e-mails de boas-vindas (consumindo cota do Resend) e poluir a base.

**Correção proposta (Sprint 1):** adicionar hCaptcha/Turnstile no cadastro, ou usar o fluxo de confirmação por e-mail (o bypass de SMTP foi feito por conveniência mas remove uma barreira anti-abuso).

---

## 3. Gaps de Infraestrutura

### 🟠 I1 — Crons no Vercel, deploy em VPS (ALTO)

**Onde:** `vercel.json` define 3 crons; `.github/workflows/deploy.yml` faz deploy **via SSH para uma VPS**.

**Problema:** crons declarados em `vercel.json` só disparam **se a aplicação estiver hospedada na Vercel**. O pipeline de deploy aponta para uma VPS (`appleboy/ssh-action`). Se a produção roda na VPS, **os 3 jobs agendados nunca executam**:

- `expire-enrollments` (expiração de acesso a cursos)
- `inactivity-reminder` (e-mail de reengajamento)
- `subscription-expiry-warning` (aviso de vencimento de assinatura)

Isso significa que **acessos expirados podem continuar válidos** e avisos de vencimento nunca são enviados — impacto direto em receita e em controle de acesso.

> ⚠️ **Requer verificação:** confirmar onde a produção realmente roda. Se for VPS, os crons precisam ser um `systemd timer` / `crontab` no servidor batendo nos endpoints com o `CRON_SECRET`. Se for Vercel, o deploy.yml está obsoleto.

Nota positiva: os endpoints de cron **estão protegidos** por `Authorization: Bearer CRON_SECRET` (`expire-enrollments/route.ts:5-7` etc.) — bom. Só falta garantir que _algo_ os chame.

---

### 🟡 I2 — Ausência de observabilidade (MÉDIO)

**Problema:** não há Sentry, nem agregação de logs, nem alertas. O tratamento de erro é `console.error` — que na VPS se perde no stdout do processo. Quando um webhook falhar, um pagamento não liberar acesso, ou um cron quebrar, **ninguém é notificado**.

**Correção proposta (Sprint 1):** integrar Sentry (erros de frontend + backend), configurar alertas para as rotas críticas (webhooks, checkout, crons) e um canal (e-mail/Slack) para falhas.

---

### 🟡 I3 — Sem ambiente de staging (MÉDIO)

**Problema:** existe apenas o projeto Supabase de produção. Migrations são aplicadas direto em prod (inclusive houve, no início desta sessão, um CLI linkado ao projeto errado). Não há onde testar mudanças de schema, RLS ou features antes de afetar dados reais.

**Correção proposta (Sprint 2):** criar um projeto Supabase de staging + um deploy de preview. Fluxo: migration → staging → validação → produção. Isso também é pré-requisito seguro para validar o fix S1 (RLS) sem risco.

---

### 🟡 I4 — Backup/PITR não confirmado (MÉDIO)

**Problema:** a estratégia de backup depende do plano do Supabase. Point-in-Time Recovery (PITR) não é garantido em todos os tiers. Com pagamentos e progresso de alunos em jogo, perda de dados é inaceitável.

**Correção proposta (Sprint 2):** confirmar no dashboard se backups diários + PITR estão ativos; se não, avaliar upgrade de plano ou rotina de `pg_dump` externa agendada.

---

### 🟢 I5 — `FULL_SETUP.sql` duplica migrations (BAIXO)

**Onde:** `supabase/migrations/FULL_SETUP.sql` reproduz o conteúdo das migrations numeradas.

**Problema:** dois "fontes da verdade" para o schema → risco de divergência (drift). Um fix aplicado numa das fontes pode não estar na outra.

**Correção proposta (Sprint 2):** eleger as migrations numeradas como fonte única e remover/arquivar o `FULL_SETUP.sql`, ou documentá-lo explicitamente como snapshot read-only gerado.

---

## 4. Gaps de Performance

### 🟢 P1 — Middleware executa `getUser()` em rotas que não precisam (BAIXO)

**Onde:** `middleware.ts` — o matcher inclui `/api/checkout/:path*` e `/api/webhooks/:path*`. Para toda requisição a essas rotas, o middleware faz `supabase.auth.getUser()`, que é uma **chamada de rede ao Supabase**.

**Problema:** em webhooks (que são server-to-server, sem sessão de usuário) essa chamada é inútil e adiciona latência a cada evento de pagamento. Sob volume de retries, custo desnecessário.

**Correção proposta (Sprint 3):** o middleware roda `getUser()` incondicionalmente; deveria fazê-lo apenas para `/dashboard` e `/admin`. Para checkout/webhooks, manter só o rate limiting e pular a resolução de sessão.

**Pontos positivos de performance (não são gaps):**

- Páginas públicas usam ISR (`revalidate` de 60–300s) — bom.
- Índices existem para as FKs principais (`enrollments`, `lesson_progress`, `modules`, `lessons`).
- `submit_quiz_attempt` é uma RPC atômica — evita corrida entre submissões simultâneas.

---

## 5. Gaps Operacionais e de Dívida Técnica

### 🟡 O1 — Três gateways de pagamento, um usado (MÉDIO)

**Onde:** `src/lib/checkout/providers/` (stripe, mercadopago, pagarme, stub) + 3 rotas de webhook (`/api/webhooks/{stripe,mercadopago,pagarme}`).

**Problema:** apenas `pagarme` está ativo. Stripe e MercadoPago são código morto mantido, com **webhooks expostos publicamente** — superfície de ataque e manutenção sem retorno. Cada webhook é um endpoint que precisa ser seguro mesmo sem uso.

**Correção proposta (Sprint 3):** decidir a estratégia (PagarMe é o oficial?). Se sim, remover ou desabilitar as rotas e o código dos outros gateways. Se são fallback intencional, documentar e garantir que seus webhooks também validem assinatura.

---

### 🟢 D1 — Tipagem do Supabase mascarada (BAIXO)

**Problema:** uso disseminado de `as never` e `as unknown as X` nas queries Supabase. Isso silencia o TypeScript e **mascara erros reais** (ex.: um `.select()` que não traz a coluna esperada passa despercebido em tempo de compilação). Já é um padrão conhecido no projeto, mas acumula risco.

**Correção proposta (Sprint 3):** gerar os tipos do banco (`supabase gen types typescript`) e usar o client tipado, eliminando os casts onde possível.

---

### Observações menores (backlog contínuo)

- `generateUniqueSlug` usa `while (true)` sem limite — risco teórico de loop caso haja anomalia de dados. Adicionar um teto de tentativas.
- Campo `name` do usuário cai para o prefixo do e-mail em alguns fluxos (o `user_metadata.full_name` do cadastro vs. o que o trigger `handle_new_user` lê). Verificar consistência.
- 8 epics (14–21) em Draft representam o roadmap de features — fora do escopo desta análise operacional, mas devem entrar no planejamento após a estabilização.

---

## 6. Plano de Ação — Sprints

> Princípio: **estabilizar antes de evoluir.** Nenhuma feature nova (epics 14-21) deve entrar antes do Sprint 0 concluído.

### 🚨 Sprint 0 — Contenção de Segurança (BLOQUEADOR)

**Objetivo:** fechar as portas abertas antes de qualquer divulgação. **Duração estimada:** 1–3 dias.

| #   | Ação                                                                                                    | Critério de aceite                                                           |
| --- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| S1  | Corrigir RLS `users_update_own` com `WITH CHECK` / trigger anti-escalação de `role`                     | Usuário `student` de teste **não** consegue setar `role=admin` via PostgREST |
| S2  | Rotacionar `service_role key`; remover `supabasecloud.md` do repo + `.gitignore`; expurgar do histórico | Chave antiga inválida; `git log` sem a chave; segredos em env/cofre          |
| S3  | Setar `PAGARME_WEBHOOK_SECRET` + mudar webhook para `fail-closed` em produção                           | Webhook sem assinatura válida retorna 401; forja não cria matrícula          |
| S4  | Separar chaves PagarMe sandbox/produção; validar coerência com `PAGARME_ENV`                            | Ambiente de teste usa chave `_test_`; produção usa chave real                |

**Gate de saída:** re-rodar o teste de forja de webhook e o teste de escalação de role — ambos devem **falhar** (bloqueados).

---

### Sprint 1 — Hardening Operacional

**Objetivo:** garantir que a plataforma "se sustente sozinha" e que falhas sejam visíveis. **Duração estimada:** 1 semana.

| #   | Ação                                                                                                             | Critério de aceite                                             |
| --- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| I1  | Confirmar host de produção; garantir execução dos 3 crons (systemd timer/crontab na VPS **ou** confirmar Vercel) | Os 3 crons executam no horário e retornam 200; logs comprovam  |
| I2  | Integrar Sentry (front + back) + alertas nas rotas críticas                                                      | Erro forçado aparece no Sentry; alerta chega ao canal definido |
| S5  | Migrar rate limiter para store com TTL (Upstash/Vercel KV)                                                       | Limite respeitado entre instâncias; sem crescimento de memória |
| S6  | Adicionar captcha (Turnstile/hCaptcha) no cadastro                                                               | Cadastro exige captcha válido; bots bloqueados                 |

---

### Sprint 2 — Ambientes, Dados e Resiliência

**Objetivo:** parar de operar/testar direto em produção; garantir recuperação. **Duração estimada:** 1 semana.

| #   | Ação                                                                    | Critério de aceite                               |
| --- | ----------------------------------------------------------------------- | ------------------------------------------------ |
| I3  | Criar projeto Supabase de staging + deploy de preview                   | Fluxo migration→staging→prod documentado e usado |
| I4  | Confirmar/ativar backups diários + PITR (ou rotina `pg_dump` externa)   | Backup verificável; teste de restore em staging  |
| I5  | Eleger migrations numeradas como fonte única; arquivar `FULL_SETUP.sql` | Sem duplicidade de schema; drift eliminado       |
| —   | Migrar credenciais para gerenciador de segredos (fechamento do S2)      | Nenhum segredo em arquivo versionado             |

---

### Sprint 3 — Performance e Limpeza de Dívida

**Objetivo:** reduzir superfície, latência e risco de manutenção. **Duração estimada:** 3–5 dias.

| #   | Ação                                                                          | Critério de aceite                                                         |
| --- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| O1  | Decidir gateway oficial; remover/desabilitar código e webhooks dos não usados | Só o gateway ativo tem rota exposta; webhooks restantes validam assinatura |
| P1  | Escopar `getUser()` do middleware apenas para `/dashboard` e `/admin`         | Webhooks/checkout sem chamada de sessão desnecessária                      |
| D1  | Gerar tipos do Supabase e remover casts `as never`/`as unknown` prioritários  | Queries críticas tipadas; typecheck sem casts nessas rotas                 |
| —   | Auditar índices (coupons, certificates, quiz_attempts) e teto no loop de slug | Índices cobrindo queries quentes; slug com limite de tentativas            |

---

### Sprint 4+ — Evolução de Produto

Retomar os **Epics 14–21** (tipos de aula multi-formato, config avançada de cursos, plan-courses, cupons, upgrade/downgrade de plano, plano semestral, precificação avançada, progresso no admin) **somente após** os Sprints 0–2. Ver `docs/stories/` e a memória `project_state`.

---

## 7. Como este documento deve ser usado

- É um **retrato de 2026-07-03**. Ao concluir cada item, marcar aqui e referenciar o commit/PR.
- Os itens marcados "⚠️ requer verificação" (S1, I1) devem ser **confirmados em staging** antes do fix — não assumir.
- Severidades são relativas ao contexto atual (plataforma em produção com pagamentos reais). Reavaliar se o contexto mudar.
- Este arquivo é o **contexto persistente** da análise; atualizá-lo conforme os sprints avançam.
