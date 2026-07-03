# Pipeline & Deploy — Fonte da Verdade

> **Este é o documento canônico de como o projeto é versionado, testado e publicado.**
> Última atualização: 2026-07-03. Manter atualizado a cada mudança de infraestrutura.

---

## 1. Onde o projeto roda

| Recurso            | Valor                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------ |
| **Hospedagem**     | **Vercel** — projeto `ead-teste-prod` (`prj_MN6z9PMfXyKNXbUzPUEUHgzJjq46`)                 |
| **Banco de dados** | **Supabase Cloud** — projeto `EAD FABIO BORGES` (`auxsvbkxrpsbfwehccto`, região us-east-2) |
| **Repositório**    | GitHub `agenciaworcode-source/eadfabioborges` (branch `main`)                              |
| **E-mail**         | Resend                                                                                     |
| **Pagamentos**     | PagarMe v5 (provider ativo). Stripe/MercadoPago existem no código mas estão inativos.      |

> Natureza do ambiente: este deploy Vercel é usado como **teste/validação online** — sobe-se a versão e valida-se direto no ambiente publicado.

---

## 2. Fonte da verdade

| Domínio                   | Fonte da verdade                                                                                                                             |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Código**                | Git — branch `main` no GitHub. Todo trabalho deve estar commitado.                                                                           |
| **Deploy**                | **Vercel** builda e publica automaticamente a partir do Git.                                                                                 |
| **Schema do banco**       | `supabase/migrations/*.sql` (migrations numeradas). `FULL_SETUP.sql` é snapshot — **não** é fonte.                                           |
| **Variáveis de ambiente** | `.env.example` lista todas as vars necessárias. Os **valores** vivem no dashboard da Vercel (e em `.env.local` para dev — nunca versionado). |
| **Crons**                 | `vercel.json` (executados nativamente pela Vercel).                                                                                          |

---

## 3. Fluxo de trabalho (git → deploy)

```
código local → commit → push origin/main → Vercel builda → publica
                              ↓
                    GitHub Actions (CI) roda em paralelo:
                    lint · typecheck · test · build
```

- **`main`** = ambiente publicado na Vercel.
- **CI (`.github/workflows/ci.yml`)**: portão de qualidade. Roda em push e PR. **Não faz deploy** — quem publica é a Vercel. Se o CI falha, o build da Vercel provavelmente também falha.
- O antigo `deploy.yml` (deploy para VPS via SSH) foi **removido** — era resquício de outra infra e não se aplica à Vercel.

### Regra de commits

O código deve estar sempre commitado e no GitHub. Trabalho não commitado = sem backup e sem deploy. (Esta seção reverte a antiga preferência de "sem commits" — que havia levado a 159 mudanças não versionadas e código sem backup.)

---

## 4. Migrations de banco

O CLI do Supabase tem um bug de resolução de path no Windows que quebra `db push` por causa dos `content_path` dos templates de e-mail em `supabase/config.toml`. Duas formas de aplicar migrations:

**A) Via SQL Editor (recomendado no momento):** copiar o conteúdo do arquivo `.sql` e executar no SQL Editor do dashboard Supabase.

**B) Via CLI:** requer `SUPABASE_DB_PASSWORD` (dashboard → Settings → Database). Comentar temporariamente as linhas `content_path` de `config.toml` antes de `npx supabase db push`, depois restaurar.

> **Pendência de infra:** avaliar um projeto Supabase de **staging** para testar migrations antes de produção. Hoje aplica-se direto em prod.

---

## 5. Variáveis de ambiente (checklist para a Vercel)

Todas as vars de `.env.example` devem estar setadas no dashboard da Vercel (Settings → Environment Variables). Atenção especial:

| Variável                          | Nota                                                                                            |
| --------------------------------- | ----------------------------------------------------------------------------------------------- |
| `SUPABASE_SERVICE_ROLE_KEY`       | Server-only. **Rotacionar** se já foi exposta. Nunca no client.                                 |
| `PAGARME_WEBHOOK_SECRET`          | **OBRIGATÓRIO em produção** — sem ele o webhook rejeita (fail-closed). Setar antes de deployar. |
| `PAGARME_API_KEY` / `PAGARME_ENV` | O prefixo da chave (`sk_test_` vs `sk_`) deve casar com o env.                                  |
| `NEXT_PUBLIC_PAGARME_PUBLIC_KEY`  | Usada na tokenização de cartão (checkout transparente).                                         |
| `CRON_SECRET`                     | Protege os endpoints de cron. A Vercel Cron deve enviá-lo.                                      |
| `NEXT_PUBLIC_APP_URL`             | URL pública do ambiente.                                                                        |

---

## 6. Landmines de deploy (ler antes de publicar)

1. **Webhook fail-closed:** o webhook do PagarMe agora rejeita em produção se `PAGARME_WEBHOOK_SECRET` não estiver setado. **Setar o secret na Vercel ANTES do deploy**, senão pagamentos param de liberar acesso.
2. **Crons só na Vercel:** os crons de `vercel.json` (expiração de matrícula, aviso de vencimento, reengajamento) só rodam porque o deploy é Vercel. Se algum dia migrar de host, recriar os agendamentos.
3. **Chaves PagarMe:** garantir que produção use chave de produção e sandbox use `sk_test_`. Cobrança real em ambiente "sandbox" é o estado a evitar.

---

## 7. Referências

- Análise de gaps e plano de sprints: `docs/analise-gaps-operacionais.md`
- Migration de segurança S1 (anti-escalação de role): `supabase/migrations/20260703000001_prevent_role_self_escalation.sql`
- Config de crons: `vercel.json`
- CI: `.github/workflows/ci.yml`
- Arquivos ignorados no deploy Vercel: `.vercelignore`
