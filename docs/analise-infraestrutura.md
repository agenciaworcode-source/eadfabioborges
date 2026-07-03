# Análise de Infraestrutura — EAD Fábio Borges

**Data:** 2026-06-20
**Revisado por:** Claude Code (QA + Arquitetura)
**Base:** mapeamento completo de rotas, componentes, hooks, stories e código-fonte

---

## Estado geral do sistema

O núcleo pedagógico está funcional: aula, quiz por aula, tarefa prática, prova final e certificado estão implementados e testados. O que falta são as camadas de controle comercial (cupons, upgrade de plano, expiração) e visibilidade do admin sobre o comportamento individual dos alunos.

---

## Mapa de stories por status

| Status       | Quantidade | Descrição                                   |
| ------------ | ---------- | ------------------------------------------- |
| **Done**     | 26 stories | Implementadas e em produção                 |
| **InReview** | 10 stories | Implementadas, aguardando validação         |
| **Ready**    | 4 stories  | Especificadas, prontas para desenvolvimento |
| **Draft**    | 20 stories | Planejadas, não implementadas               |

---

## ADMIN — Gestão

### O que está pronto

- Dashboard com métricas reais: total de alunos, receita estimada do mês, taxa de conclusão, certificados emitidos
- Relatórios com gráfico de receita mensal, distribuição por plano (donut) e ranking de cursos
- Gestão completa de cursos: criação, edição, módulos, aulas, reordenação drag-and-drop, thumbnail
- Gestão de alunos e matrículas com matrícula manual
- Gestão de planos
- Central de avaliações (quiz por aula e prova final por curso)
- Builder de certificados com template customizável
- Histórico de submissões de tarefas por aula (`/admin/tarefas/[id]`)

### O que está faltando

| Gap                                                                  | Arquivo de referência                           | Impacto                                                                                      |
| -------------------------------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Exportar relatórios** — botão existe mas está `disabled`           | `src/app/(admin)/admin/relatorios/page.tsx:226` | Admin não consegue exportar dados para Excel/CSV                                             |
| **Drill-down de progresso por aluno** — stories 21.1 e 21.2 em Draft | `docs/stories/21.1.story.md`, `21.2.story.md`   | Admin vê taxa geral mas não sabe quem travou em qual aula                                    |
| **Sistema de cupons** — stories 17.1 a 17.4 em Draft                 | `docs/stories/17.*.story.md`                    | Impossível fazer promoções ou descontos                                                      |
| **Associação curso↔plano** — stories 16.1 a 16.4 em Draft            | `docs/stories/16.*.story.md`                    | Todos os planos dão acesso a todos os cursos — sem granularidade                             |
| **Upgrade/downgrade de plano** — stories 18.1 a 18.4 em Draft        | `docs/stories/18.*.story.md`                    | Aluno que quer mudar de plano não tem fluxo                                                  |
| **Sem alerta quando aluno envia tarefa**                             | Não existe notificação no sistema               | Admin precisa entrar manualmente para ver submissões pendentes                               |
| **Sem busca/filtro na lista de alunos**                              | `src/components/admin/AdminAlunosClient.tsx`    | Com muitos alunos a gestão fica inviável                                                     |
| **Expiração de acesso no frontend** — stories 15.3 e 15.4 em Draft   | `docs/stories/15.3.story.md`, `15.4.story.md`   | O cron de expiração existe na API mas o bloqueio de acesso não está implementado no frontend |

---

## ALUNO — Experiência de uso

### O que está pronto

- Dashboard com progresso geral e card "continue de onde parou"
- Player de vídeo Vimeo com rastreamento de progresso
- Quiz por aula com múltipla escolha, verdadeiro/falso e dissertativa; controle de tentativas
- Prova final de curso desbloqueada após todas as aulas serem concluídas
- Tarefas práticas com upload de arquivo
- Certificado gerado automaticamente ao concluir, com verificação pública por UUID
- Página "Meus Cursos" com barra de progresso por curso

### O que está faltando

| Gap                                                                      | Arquivo de referência                            | Impacto                                                              |
| ------------------------------------------------------------------------ | ------------------------------------------------ | -------------------------------------------------------------------- |
| **Auto-resume de vídeo** — story 22.4 em Ready                           | `docs/stories/22.4.story.md`                     | Aluno sempre começa do início mesmo que tenha saído no meio da aula  |
| **Histórico de tentativas do quiz** — não há tela                        | Não existe rota no dashboard                     | Aluno não sabe quantas tentativas usou ou qual foi sua nota anterior |
| **Resultado de tarefa prática** — aluno envia mas não vê feedback inline | `src/components/assignment/AssignmentUpload.tsx` | Aluno não sabe quando foi corrigido nem qual foi o retorno           |
| **Busca no catálogo de cursos**                                          | `src/app/cursos/page.tsx`                        | Com muitos cursos vira problema de usabilidade                       |
| **Expiração de matrícula no frontend**                                   | stories 15.3 e 15.4 em Draft                     | Aluno com matrícula expirada consegue acessar normalmente            |
| **Campo de cupom no checkout** — story 17.4 em Draft                     | `docs/stories/17.4.story.md`                     | Sem campo para inserir desconto no fluxo de compra                   |
| **Upgrade de plano funcional**                                           | `src/app/(dashboard)/dashboard/plano/page.tsx`   | Página existe mas sem botão de upgrade conectado ao Stripe           |
| **Notificação de matrícula aprovada**                                    | Email existe via Resend, sem confirmação visual  | Aluno não tem feedback visual de que foi aceito                      |

---

## FINANCEIRO / CHECKOUT

### O que está pronto

- Checkout Stripe (cartão de crédito)
- Webhook Stripe para ativação automática de matrícula
- PIX via MercadoPago (webhook implementado)
- Página de sucesso (`/checkout/sucesso`) e cancelamento (`/checkout/cancelado`)
- Planos com preços configuráveis pelo admin

### O que está faltando

| Gap                                   | Story                | Impacto                                                                               |
| ------------------------------------- | -------------------- | ------------------------------------------------------------------------------------- |
| **Parcelamento no cartão**            | 20.4 em Draft        | Sem opção de parcelamento na Stripe Session                                           |
| **Precificação individual por curso** | 20.1 a 20.3 em Draft | Todos os cursos usam o preço do plano; sem compra avulsa com preço próprio na landing |
| **Upgrade de plano via Stripe**       | 18.3 em Draft        | Mudança de plano não atualiza a subscription na Stripe                                |
| **Período semestral**                 | 19.1 a 19.3 em Draft | Apenas cobrança mensal disponível                                                     |
| **Cupom no checkout**                 | 17.3 em Draft        | Sem aplicação de desconto no fluxo de pagamento                                       |

---

## INFRAESTRUTURA / ROBUSTEZ

### O que está pronto

- SEO completo: sitemap dinâmico, robots.txt, meta tags
- Cron de expiração de matrículas (`/api/cron/expire-enrollments`)
- Cron de lembrete de inatividade (`/api/cron/inactivity-reminder`)
- Emails automáticos com Resend (boas-vindas, matrícula, conclusão)
- Health check endpoint (`/api/health`)
- Middleware de autenticação e controle de acesso por rota
- AccessGate por plano do aluno

### Bugs identificados (não corrigidos)

| Bug                                                  | Severidade     | Arquivo                            | Descrição                                                                                                                                                                                      |
| ---------------------------------------------------- | -------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **BUG-1: Bypass silencioso de limite de tentativas** | MÉDIA          | `src/app/api/quiz/submit/route.ts` | A query de contagem de `quiz_attempts` não verifica o `error` retornado. Se a query falhar, `count` vira `null`, `usedCount` assume `0` e o aluno ganha tentativas ilimitadas silenciosamente. |
| **BUG-2: `checkCourseCompletion` fire-and-forget**   | BAIXA          | `src/app/api/progress/route.ts`    | Função cria novo `createClient()` após o response ser enviado. O contexto de cookies do request pode não existir mais, causando falha silenciosa na conclusão automática de curso.             |
| **BUG-3: Quiz só-dissertativo sempre reprova**       | BAIXA (design) | `src/app/api/quiz/submit/route.ts` | Se `gradableQuestions.length === 0`, `score` resulta em `0` e o aluno reprova. Questões dissertativas precisariam de correção manual.                                                          |

### O que está faltando

| Gap                                                                                            | Impacto                                               |
| ---------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| **Sem monitoramento de erros em produção** — nenhum Sentry, Datadog ou similar                 | Erros em produção são invisíveis até o aluno reclamar |
| **Sem rate limiting nas APIs** — endpoints de quiz/submit, checkout e progress sem proteção    | Suscetível a abuso e tentativas em massa              |
| **Logs estruturados** — não há logging de eventos críticos (pagamento, certificado, conclusão) | Auditoria e diagnóstico em produção são inviáveis     |

---

## Rotas implementadas — referência completa

### Páginas públicas

| Rota                  | Status                       |
| --------------------- | ---------------------------- |
| `/`                   | Done — landing page          |
| `/cursos`             | Done — catálogo público      |
| `/cursos/[slug]`      | Done — detalhe do curso      |
| `/planos`             | Done — comparativo de planos |
| `/certificado/[uuid]` | Done — verificação pública   |
| `/checkout/sucesso`   | Done                         |
| `/checkout/cancelado` | Done                         |

### Dashboard do aluno

| Rota                      | Status                                             |
| ------------------------- | -------------------------------------------------- |
| `/dashboard`              | Done — visão geral com progresso                   |
| `/dashboard/cursos`       | Done — meus cursos                                 |
| `/dashboard/curso/[id]`   | Done — player + quiz + tarefa                      |
| `/dashboard/certificados` | Done — listagem de certificados                    |
| `/dashboard/perfil`       | Done — edição de perfil                            |
| `/dashboard/plano`        | Parcial — exibe plano atual, sem upgrade funcional |

### Admin

| Rota                  | Status                                        |
| --------------------- | --------------------------------------------- |
| `/admin`              | Done — visão geral com métricas               |
| `/admin/cursos`       | Done — gestão completa de cursos              |
| `/admin/alunos`       | Done — listagem e gestão                      |
| `/admin/matriculas`   | Done — controle de matrículas                 |
| `/admin/planos`       | Done — gestão de planos                       |
| `/admin/avaliacoes`   | Done — central de avaliações                  |
| `/admin/certificados` | Done — builder de certificados                |
| `/admin/relatorios`   | Done — relatórios com exportação desabilitada |
| `/admin/tarefas/[id]` | Done — submissões de tarefas                  |

### APIs

| Endpoint                                    | Método         | Função                           |
| ------------------------------------------- | -------------- | -------------------------------- |
| `/api/admin/courses`                        | GET/POST       | CRUD de cursos                   |
| `/api/admin/courses/[id]`                   | GET/PUT/DELETE | Curso específico                 |
| `/api/admin/courses/[id]/modules`           | GET/POST       | Módulos do curso                 |
| `/api/admin/courses/[id]/modules/reorder`   | PUT            | Reordenar módulos                |
| `/api/admin/courses/[id]/quiz`              | GET/POST       | Prova final do curso             |
| `/api/admin/courses/[id]/thumbnail`         | POST           | Upload de thumbnail              |
| `/api/admin/courses/[id]/duplicate`         | POST           | Duplicar curso                   |
| `/api/admin/courses/[id]/enrollments`       | GET            | Matrículas do curso              |
| `/api/admin/modules/[id]`                   | PUT/DELETE     | Módulo específico                |
| `/api/admin/modules/[id]/lessons`           | GET/POST       | Aulas do módulo                  |
| `/api/admin/modules/[id]/lessons/reorder`   | PUT            | Reordenar aulas                  |
| `/api/admin/lessons/[id]`                   | PUT/DELETE     | Aula específica                  |
| `/api/admin/lessons/[id]/quiz`              | GET/POST       | Quiz da aula                     |
| `/api/admin/lessons/[id]/assignment`        | GET/POST       | Tarefa da aula                   |
| `/api/admin/quizzes/[id]`                   | PUT/DELETE     | Quiz específico                  |
| `/api/admin/quizzes/[id]/questions`         | GET/POST       | Questões do quiz                 |
| `/api/admin/questions/[id]`                 | PUT/DELETE     | Questão específica               |
| `/api/admin/assignments/[id]`               | GET/PUT        | Tarefa (corrigir)                |
| `/api/admin/enrollments`                    | GET/POST       | Matrículas                       |
| `/api/admin/enrollments/[id]`               | PUT/DELETE     | Matrícula específica             |
| `/api/admin/enroll`                         | POST           | Matrícula manual                 |
| `/api/admin/users/[id]/plan`                | PUT            | Alterar plano do aluno           |
| `/api/admin/users/[id]/profile`             | PUT            | Alterar perfil do aluno          |
| `/api/admin/plans/[id]`                     | PUT            | Editar plano                     |
| `/api/admin/certificates/template`          | GET/PUT        | Template de certificado          |
| `/api/admin/certificates/assets`            | POST           | Upload de assets do certificado  |
| `/api/quiz/[lessonId]`                      | GET            | Quiz de uma aula                 |
| `/api/quiz/course/[courseId]`               | GET            | Prova final do curso             |
| `/api/quiz/submit`                          | POST           | Submeter respostas do quiz       |
| `/api/quiz/attempt/[quizId]`                | GET            | Histórico de tentativas          |
| `/api/progress`                             | POST           | Marcar aula como concluída       |
| `/api/progress/[courseId]`                  | GET            | Progresso detalhado no curso     |
| `/api/assignment/lesson/[lessonId]`         | GET            | Tarefa de uma aula               |
| `/api/assignment/submission/[submissionId]` | GET            | Submissão específica             |
| `/api/assignment/upload`                    | POST           | Upload de arquivo de tarefa      |
| `/api/certificate/generate`                 | POST           | Gerar certificado                |
| `/api/certificate/[uuid]`                   | GET            | Verificar certificado público    |
| `/api/checkout/curso`                       | POST           | Iniciar checkout de curso avulso |
| `/api/checkout/plano`                       | POST           | Iniciar checkout de plano        |
| `/api/webhooks/stripe`                      | POST           | Eventos Stripe                   |
| `/api/webhooks/mercadopago`                 | POST           | Eventos MercadoPago/PIX          |
| `/api/cron/expire-enrollments`              | GET            | Expirar matrículas vencidas      |
| `/api/cron/inactivity-reminder`             | GET            | Lembrete de inatividade          |
| `/api/health`                               | GET            | Health check                     |

---

## Prioridade de desenvolvimento sugerida

### Fase 1 — Sem isso o produto não funciona corretamente

1. **Fix BUG-1** — verificação de erro na contagem de tentativas de quiz (`src/app/api/quiz/submit/route.ts`)
2. **Expiração de acesso no frontend** — stories 15.3 e 15.4 — o cron já existe, falta bloquear o acesso na UI
3. **Drill-down de progresso por aluno no admin** — stories 21.1 e 21.2
4. **Auto-resume de vídeo** — story 22.4 — básico de UX para qualquer EAD
5. **Notificação para admin quando tarefa é enviada** — email ou badge no menu

### Fase 2 — Comercialmente necessário

6. **Sistema de cupons** — stories 17.1 a 17.4
7. **Upgrade/downgrade de plano** — stories 18.1 a 18.4
8. **Exportar relatórios em CSV** — desbloquear o botão em `/admin/relatorios`
9. **Parcelamento no checkout** — story 20.4

### Fase 3 — Polimento e escala

10. **Associação curso↔plano** — stories 16.1 a 16.4
11. **Histórico de tentativas visível para o aluno**
12. **Período semestral** — stories 19.1 a 19.3
13. **Busca e filtro no catálogo de cursos**
14. **Monitoramento de erros em produção** (Sentry ou similar)
15. **Rate limiting nas APIs críticas**

---

## Resumo executivo

O EAD está funcionalmente completo no núcleo de aprendizado: um aluno consegue se matricular, assistir aulas, fazer quizzes, enviar tarefas e obter certificado. O admin consegue criar cursos completos e ver métricas gerais.

As lacunas críticas estão em três frentes:

- **Controle de acesso** — expiração de matrículas existe no backend mas não bloqueia o frontend
- **Visibilidade do admin** — não há como ver o progresso individual de um aluno dentro de um curso
- **Comercial** — sem cupons, sem upgrade de plano, sem parcelamento; a plataforma depende de fluxos manuais para o que deveria ser automático

Com a Fase 1 implementada, o produto atinge maturidade mínima para operação sem intervenção manual constante.
