# 15. Segurança e Performance

## 15.1 Segurança

**Frontend:**

- CSP Headers via `next.config.ts`: bloquear scripts inline, permitir apenas domínios conhecidos
- Sem dados sensíveis em `NEXT_PUBLIC_*` (apenas anon key e publishable key são seguras)
- `<script>` e `eval` nunca usados

**Backend:**

- Zod em 100% das API routes — nunca confiar em input do cliente
- Service Role Key apenas em contextos server-side (webhooks, triggers)
- Raw body para verificação de webhooks Stripe (nunca parsear antes)
- Rate limiting no Nginx: 10 req/s por IP nas rotas `/api/*`

**Headers de Segurança (next.config.ts):**

```typescript
headers: [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
]
```

**Supabase RLS:**

- Política "deny by default" — tabelas sem policy = acesso negado
- Service Role Key usada apenas em webhooks (server-side apenas)
- Anon Key exposta ao client — apenas lê dados públicos (cursos publicados)

## 15.2 Performance

**Frontend:**

- Bundle target: JS inicial < 200KB (gzipped)
- next/image para todas as imagens (WebP automático + lazy loading)
- Poppins: `display=swap` para evitar FOIT
- Server Components por padrão (zero JS enviado ao client)
- Skeleton loaders em vez de spinners (evita CLS)

**Backend:**

- Response time target: p95 < 200ms para API routes simples
- Cache de dados públicos (cursos): ISR com `revalidate: 3600` (1h)
- Índices nos campos de join mais frequentes (ver §9.3)
- Supabase connection pooling via Supabase Pooler (port 6543 para server-side)

**VPS:**

- Nginx gzip para text/html, CSS, JS, JSON
- Cache de assets estáticos: `Cache-Control: public, max-age=31536000` (1 ano)
- PM2 cluster mode: 4 workers no VPS 4 vCPU

---
