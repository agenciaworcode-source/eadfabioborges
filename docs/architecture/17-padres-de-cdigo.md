# 17. Padrões de Código

## 17.1 Regras Críticas

- **Zod First:** Toda API route começa com `schema.parse(body)` — sem exceção
- **Server Client por Request:** `createServerClient()` chamado dentro da função, nunca como singleton (cookies mudam por request)
- **Service Role = Server Only:** `SUPABASE_SERVICE_ROLE_KEY` nunca em arquivos com `'use client'`
- **Raw Body para Webhooks:** Nunca chamar `request.json()` antes de `stripe.webhooks.constructEvent()`
- **Tipos do Supabase:** Usar tipos de `src/types/database.ts` (gerados por `supabase gen types`), nunca definir tipos de tabela manualmente
- **Sem process.env direto:** Acessar via objetos de config em `src/lib/*.ts`
- **Imports Absolutos:** Sempre `@/components/...`, nunca `../../components/...`

## 17.2 Convenções de Nomenclatura

| Elemento                  | Frontend            | Backend    | Exemplo                    |
| ------------------------- | ------------------- | ---------- | -------------------------- |
| Componentes               | PascalCase          | —          | `VimeoPlayer.tsx`          |
| Hooks                     | camelCase com 'use' | —          | `useProgress.ts`           |
| API Routes                | —                   | kebab-case | `/api/quiz/submit`         |
| Tabelas DB                | —                   | snake_case | `lesson_progress`          |
| Variáveis de Env públicas | NEXT*PUBLIC* prefix | —          | `NEXT_PUBLIC_SUPABASE_URL` |
| Arquivos de lib           | camelCase           | camelCase  | `certificate-generator.ts` |

---
