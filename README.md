# Plataforma EAD Mentoria Fábio Borges

Plataforma de ensino a distância premium para profissionais de saúde estética.

**Domínio:** `ead.fabioborgesoficial.com.br`

## Stack

| Camada         | Tecnologia                           |
| -------------- | ------------------------------------ |
| Framework      | Next.js 14 App Router + TypeScript   |
| Estilização    | Tailwind CSS 3.4 + shadcn/ui         |
| Banco de dados | Supabase PostgreSQL + RLS            |
| Auth           | Supabase Auth (email + Google OAuth) |
| Pagamentos     | Stripe + MercadoPago (PIX)           |
| Emails         | Resend + React Email                 |
| Deploy         | VPS Ubuntu 24.04 + PM2 + Nginx       |

## Setup Local

```bash
# 1. Clone o repositório
git clone <repo-url>
cd ead-fabioborges

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run start        # Servidor de produção
npm run lint         # Verificar erros de linting
npm run typecheck    # Verificar tipos TypeScript
npm run format:check # Verificar formatação (Prettier)
npm run format       # Formatar todos os arquivos
```

## Branch Strategy

| Branch    | Propósito   | Deploy                               |
| --------- | ----------- | ------------------------------------ |
| `main`    | Produção    | Auto-deploy via GitHub Actions → VPS |
| `staging` | Homologação | Deploy manual                        |
| `feat/*`  | Features    | PR → `main` ou `staging`             |

Nunca fazer push direto para `main`. Sempre via Pull Request.
