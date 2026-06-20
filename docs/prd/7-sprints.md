# 7. Sprints

## Sprint 1 — Base do Projeto & VPS (Semana 1 · 40h)

**Meta:** Projeto rodando local e na VPS, banco com migrations, CI/CD via GitHub Actions.

**Setup & Scaffolding (7h)**

- Inicializar projeto Next.js 14 + TypeScript + Tailwind CSS (3h)
- Configurar ESLint, Prettier e Husky (2h)
- Estruturar pastas: /app /components /lib /types /emails /styles (1h)
- Criar repositório GitHub + branch strategy (main / staging / feat/\*) (1h)

**Banco de Dados — Supabase (17h)**

- Criar projeto Supabase cloud + local via Docker (Supabase CLI) (2h)
- Migration: tabelas users, courses, modules, lessons (3h)
- Migration: enrollments, subscriptions, lesson_progress (3h)
- Migration: quizzes, questions, quiz_attempts, assignments, submissions, certificates (3h)
- Implementar Row Level Security em todas as 13 tabelas (4h)
- Seed de dados de desenvolvimento (3 cursos, 2 módulos, 5 aulas cada) (2h)

**VPS & DevOps (10h)**

- Provisionar VPS Ubuntu 24.04: Node 22 LTS, PM2, Nginx, UFW, Fail2ban (3h)
- Configurar domínio DNS + SSL Let's Encrypt via Certbot (1h)
- Criar GitHub Actions workflow: lint → build → SSH deploy → PM2 reload (4h)
- Configurar variáveis de ambiente no servidor (.env.production) (1h)
- Testar pipeline completo: push → deploy automático funcionando (1h)

**Cerimônias Scrum (6h)**

- Sprint Review: banco estruturado + VPS rodando + CI funcionando (2h)
- Retrospectiva + Planning da Sprint 2 (2h)
- Buffer de contingência (2h)

---

## Sprint 2 — Auth & Área do Aluno (Semana 2 · 40h)

**Meta:** Aluno cadastra, loga com Google, vê dashboard, acesso controlado automaticamente pelo banco.

**Autenticação (11h)**

- Integrar Supabase Auth: fluxo email/senha completo (3h)
- Integrar OAuth Google via Supabase + callback handler (2h)
- Páginas: /auth/login, /auth/cadastro, /auth/recuperar-senha (4h)
- Middleware Next.js: proteger rotas /dashboard/_ e /admin/_ (2h)

**Dashboard do Aluno (12h)**

- Layout base: sidebar responsiva + header + avatar + nav (3h)
- /dashboard: cards de cursos matriculados + barra de progresso visual (4h)
- /dashboard/perfil: editar nome, foto, especialidade, cidade (3h)
- /dashboard/plano: exibir plano ativo + data de renovação + benefícios (2h)

**Controle de Acesso por Plano (9h)**

- Lógica de verificação: enrollment? OR subscription.plan inclui o curso? (3h)
- Componente `<AccessGate>`: bloqueia conteúdo + CTA para checkout (3h)
- Testar todos os cenários: free, Prata, Ouro, Diamante, curso avulso (3h)

**Cerimônias Scrum (7h)**

- Sprint Review: demo do fluxo de auth + dashboard (2h)
- Retrospectiva + Planning Sprint 3 (2h)
- Buffer (3h)

---

## Sprint 3 — Pagamentos & Planos (Semana 3 · 44h)

**Meta:** Visitante paga → webhook confirma → matrícula criada → acesso liberado. Zero intervenção manual.

**Stripe — Cursos Avulsos (12h)**

- Criar Stripe Products + Prices para os 6 cursos abertos (2h)
- API route POST `/api/checkout/curso`: criar Checkout Session (3h)
- Páginas /cursos/[slug]: landing de venda + botão de compra (5h)
- Páginas /checkout/sucesso e /checkout/cancelado (2h)

**Stripe — Assinaturas (9h)**

- Criar Stripe Products + Prices recorrentes para planos Prata, Ouro, Diamante (2h)
- Página /planos: cards dos 4 planos com CTAs de checkout (4h)
- API route POST `/api/checkout/plano`: criar Subscription Session (3h)

**Webhooks & PIX (17h)**

- API route POST `/api/webhooks/stripe`: verificar assinatura HMAC (3h)
- Handler `checkout.session.completed` → criar enrollment ou subscription (3h)
- Handlers `subscription.updated / deleted` → atualizar status no Supabase (3h)
- PIX via MercadoPago: integrar SDK + criar preferência de pagamento (4h)
- Testes end-to-end em sandbox (todos os cenários de pagamento) (4h)

**Cerimônias Scrum (5h)**

- Sprint Review: demo fluxo completo compra → acesso liberado (2h)
- Retrospectiva + Planning Sprint 4 (2h)
- Buffer (1h)

---

## Sprint 4 — Conteúdo & Avaliações (Semana 4 · 44h)

**Meta:** Aluno assiste aulas, progresso é salvo, faz quiz, envia tarefa. Mentor corrige pelo admin.

**Player de Vídeo & Progresso (11h)**

- Componente `<VimeoPlayer>`: embed via oEmbed API + controles customizados (4h)
- Auto-save de progresso: POST `/api/progress` a cada 30s durante o vídeo (3h)
- Marcar aula como concluída ao atingir 90% do vídeo assistido (2h)
- Barra de progresso do curso: (aulas concluídas / total) × 100 (2h)

**Sistema de Quiz (12h)**

- Componente `<Quiz>`: renderiza múltipla escolha, V/F e dissertativa (5h)
- API route POST `/api/quiz/submit`: calcular nota + salvar quiz_attempt (3h)
- Resultado: nota, gabarito configurável, botão refazer (se permitido) (2h)
- Lógica de bloqueio: próxima aula só liberada após quiz aprovado (2h)

**Tarefas Práticas (10h)**

- `<AssignmentUpload>`: drag-drop de PDF, imagem, ZIP (máx 50 MB) (4h)
- Upload para Supabase Storage + registro em submissions (2h)
- /admin/tarefas/[id]: listar submissions + form de correção com nota e feedback (4h)

**Conteúdo & Cerimônias (11h)**

- Seed dos 9 cursos com módulos e aulas reais (IDs Vimeo) (4h)
- Sprint Review + Retrospectiva + Planning Sprint 5 (2h)
- Buffer (1h)

---

## Sprint 5 — Certificados (Semana 5 · 36h)

**Meta:** Ao concluir com nota ≥ 70%, certificado PDF gerado automaticamente com design premium e QR Code verificável.

**Design & Geração do Certificado (16h)**

- Criar template visual do certificado (identidade Mentoria: escuro, dourado) (6h)
- Integrar pdf-lib: gerar PDF com nome, curso, data e UUID único (4h)
- Inserir assinatura PNG do Mestre Fábio Borges no PDF (2h)
- Gerar QR Code (npm qrcode) apontando para `/certificado/[uuid]` (2h)
- Salvar PDF no Supabase Storage + inserir registro em certificates (2h)

**Trigger de Conclusão & Verificação (14h)**

- Edge Function: detectar `enrollment.status = completed` + nota ≥ 70% (3h)
- Disparar geração assíncrona do certificado (não bloqueia UX) (2h)
- Página pública `/certificado/[uuid]`: exibir dados verificáveis (3h)
- `/dashboard/certificados`: listar e baixar todos os certificados do aluno (3h)
- Teste end-to-end: concluir curso → gerar cert → verificar QR Code (3h)

**Cerimônias Scrum (6h)**

- Sprint Review: demo ao vivo de certificado sendo emitido (2h)
- Retrospectiva + Planning Sprint 6 (2h)
- Buffer (2h)

---

## Sprint 6 — Emails & Admin (Semana 6 · 40h)

**Meta:** Fábio gerencia tudo pelo admin sem tocar no banco. Todos os emails têm identidade visual da Mentoria.

**Emails Automáticos (Resend) (17h)**

- Configurar Resend: domínio próprio + SPF, DKIM, DMARC (2h)
- Template: boas-vindas + acesso liberado pós-pagamento (3h)
- Template: curso concluído + certificado emitido (2h)
- Template: lembrete de inatividade (7/14/30 dias via cron job) (3h)
- Template: renovação de plano / falha de pagamento (período de graça) (2h)
- Template: tarefa corrigida com nota e feedback do mentor (2h)
- Cron job (PM2): verificar alunos inativos + disparar lembretes (3h)

**Painel Admin (13h)**

- Layout /admin: sidebar + proteção de rota (role = admin) (2h)
- /admin/alunos: listar, buscar, ver progresso, matricular manualmente (4h)
- /admin/cursos: CRUD completo de cursos, módulos e aulas (4h)
- /admin/relatorios: receita, taxa de conclusão, alunos inativos (3h)

**Cerimônias Scrum (5h)**

- Sprint Review: demo completo de todos os fluxos integrados (2h)
- Retrospectiva + Planning Sprint 7 (2h)
- Buffer UX (1h)

---

## Sprint 7 — QA & Go-Live (Semana 7 · 36h)

**Meta:** Plataforma em produção com Lighthouse ≥ 90, todos os fluxos testados end-to-end, backups ativos, documentação entregue.

**Segurança & Hardening (11h)**

- Auditar todas as policies RLS: tentar acesso cruzado entre usuários (4h)
- Rate limiting no Nginx: 10 req/s por IP nas rotas de API (2h)
- Headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options (2h)
- Validação Zod em 100% das API routes (nunca confiar no cliente) (3h)

**Performance & SEO (8h)**

- Lighthouse audit: meta ≥ 90 em Performance, Acessibilidade e SEO (3h)
- Otimizar imagens: next/image + WebP + lazy loading (2h)
- SEO: meta tags, sitemap.xml, robots.txt, OG tags para páginas de curso (2h)
- Nginx: gzip habilitado + cache de assets estáticos (1 ano) (1h)

**QA End-to-End (9h)**

- Fluxo 1 completo: visita → compra → acesso → conclusão → certificado (3h)
- Fluxo 2 completo: assinar plano → acesso VIP → renovação → cancelamento (2h)
- Testar em mobile: iOS Safari + Android Chrome (todos os fluxos críticos) (2h)
- Teste de carga: 50 usuários simultâneos (k6 ou Locust) (2h)

**Go-Live & Documentação (8h)**

- Backups automáticos: Supabase + VPS via Restic + S3 (2h)
- UptimeRobot + alerta WhatsApp configurado (1h)
- Documentação operacional: adicionar curso, matricular aluno, ver relatórios (2h)
- Deploy final em produção + smoke test de todos os fluxos (2h)
- Sprint Review final + Retrospectiva do projeto completo (2h)

---
