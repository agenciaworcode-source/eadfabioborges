# 3. Tech Stack

## 3.1 Tabela de Tecnologias

| Categoria            | Tecnologia                | Versão            | Propósito                                          | Rationale                                                            |
| -------------------- | ------------------------- | ----------------- | -------------------------------------------------- | -------------------------------------------------------------------- |
| Frontend Language    | TypeScript                | 5.x               | Type safety em todo o projeto                      | Evita bugs runtime, autocomplete rico, mandatório com Next.js        |
| Frontend Framework   | Next.js                   | 14.x (App Router) | Framework fullstack principal                      | SSR/SSG/ISR, API routes nativas, sem servidor separado               |
| UI Component Library | shadcn/ui + Radix UI      | latest            | Componentes acessíveis sem bundling weight         | Copy-paste sem dependência de lib externa, Radix para acessibilidade |
| CSS Framework        | Tailwind CSS              | 3.4.x             | Estilização utility-first                          | Alinhado com shadcn, tree-shaking nativo, zero CSS morto em prod     |
| State Management     | Zustand                   | 4.x               | Estado global leve (auth, cart)                    | Sem boilerplate Redux, API simples, SSR-compatible                   |
| Server State         | TanStack Query            | 5.x               | Cache e sync de dados do servidor                  | Evita waterfalls, retry automático, invalidação por evento           |
| Forms                | React Hook Form + Zod     | 7.x / 3.x         | Formulários performáticos com validação            | Zero re-renders desnecessários, Zod compartilhado frontend/backend   |
| Backend Language     | TypeScript                | 5.x               | Mesmo da linguagem frontend                        | Tipos compartilhados, sem context switch                             |
| Backend Runtime      | Node.js                   | 22.x LTS          | Runtime do Next.js                                 | Estável, suportado até 2027                                          |
| API Style            | REST (Next.js API Routes) | —                 | Endpoints para Stripe, webhooks, progresso         | Simples, sem overhead GraphQL para este domínio                      |
| Database             | PostgreSQL (via Supabase) | 15.x              | Banco principal com RLS                            | ACID, RLS nativo, sem ORM necessário                                 |
| Auth                 | Supabase Auth             | 2.x               | Email/senha + Google OAuth                         | JWT integrado com RLS, sem servidor de auth separado                 |
| File Storage         | Supabase Storage          | —                 | PDFs de certificados, uploads de tarefas           | S3-compatible, integrado com RLS, URLs presigned                     |
| Email                | Resend + React Email      | 3.x / 2.x         | Emails transacionais tipados                       | Deliverability excelente, templates em React/TypeScript              |
| Vídeo                | Vimeo oEmbed API          | —                 | Embed de aulas com controle de domínio             | Proteção por domínio, analytics básico                               |
| PDF                  | pdf-lib + qrcode          | 1.x / 1.x         | Geração de certificados                            | Sem servidor externo, geração local na VPS                           |
| Pagamentos (cartão)  | Stripe SDK                | 14.x              | Checkout + Subscriptions + Webhooks                | Melhor DX do mercado, suporte a parcelamento                         |
| Pagamentos (PIX)     | MercadoPago SDK           | 2.x               | PIX brasileiro                                     | Único provider relevante para PIX com webhook                        |
| Validation           | Zod                       | 3.x               | Schemas compartilhados API + forms                 | Single source of truth para validação                                |
| Frontend Testing     | Vitest + Testing Library  | 1.x               | Unit/integration tests de componentes              | Compatível com Vite, rápido, API Jest-compatible                     |
| Backend Testing      | Vitest                    | 1.x               | Unit tests de API routes e utils                   | Mesmo runner do frontend                                             |
| E2E Testing          | Playwright                | 1.x               | Testes dos 3 fluxos críticos                       | Cross-browser, script confiável, usado na Sprint 7                   |
| Load Testing         | k6                        | 0.50.x            | Teste de carga: 50 usuários simultâneos (Sprint 7) | CLI-first, scripting em JS, métricas detalhadas                      |
| Process Manager      | PM2                       | 5.x               | Cluster mode + auto-restart + logs                 | Zero-downtime reload, múltiplos workers                              |
| Reverse Proxy        | Nginx                     | 1.24.x            | SSL termination + rate limiting + gzip             | Battle-tested, configuração conhecida                                |
| SSL                  | Let's Encrypt + Certbot   | —                 | HTTPS gratuito com auto-renewal                    | Padrão de mercado para VPS                                           |
| CI/CD                | GitHub Actions            | —                 | Lint → Build → SSH Deploy → PM2 reload             | Integrado ao GitHub, sem custo adicional                             |
| Monitoring           | UptimeRobot               | —                 | Ping 5min + alerta WhatsApp                        | Free tier suficiente, zero config                                    |
| Backup               | Restic + S3/B2            | —                 | Backup diário VPS + Supabase                       | Incremental, criptografado, retenção 30 dias                         |
| Linting              | ESLint + Prettier         | 8.x / 3.x         | Qualidade de código                                | Husky pre-commit hooks                                               |
| Git Hooks            | Husky + lint-staged       | 9.x / 15.x        | Pre-commit quality gate                            | Bloqueia commits com erros de lint/type                              |

---
