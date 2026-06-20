# 12. Estrutura Unificada do Projeto

```
ead-fabioborges/
├── .github/
│   └── workflows/
│       ├── ci.yaml                   # lint + typecheck + build
│       └── deploy.yaml               # SSH → VPS → PM2 reload
├── .aiox-core/                       # AIOX Framework (não modificar)
├── .claude/                          # Claude Code config
├── docs/
│   ├── prd.md                        # ✅ gerado
│   ├── front-end-spec.md             # ✅ gerado
│   └── fullstack-architecture.md    # ✅ este documento
├── src/
│   ├── app/                          # Next.js App Router (ver §10.1)
│   ├── components/                   # Componentes React
│   ├── lib/                          # Utilitários e clientes
│   ├── emails/                       # React Email templates
│   ├── types/                        # TypeScript types
│   └── hooks/                        # React hooks customizados
├── supabase/
│   ├── migrations/                   # SQL migrations versionadas
│   ├── seed.sql                      # Dados de desenvolvimento
│   └── config.toml                   # Supabase CLI config
├── public/
│   ├── images/
│   │   └── assinatura-fabio.png      # Assinatura para certificados
│   └── favicon.ico
├── tests/
│   ├── unit/                         # Vitest unit tests
│   ├── integration/                  # Vitest integration tests
│   └── e2e/                          # Playwright E2E tests
├── .env                              # Configurado pelo AIOX install
├── .env.example                      # Template de variáveis
├── .gitignore
├── middleware.ts                     # Auth guard (raiz do projeto)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── pm2.ecosystem.config.js           # Config PM2 para VPS
```

---
