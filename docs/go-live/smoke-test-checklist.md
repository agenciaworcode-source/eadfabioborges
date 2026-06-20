# Smoke Test Checklist — Go-Live EAD Fábio Borges

Execute este checklist manualmente antes de cada deploy em produção.
**Ambiente:** produção (https://ead.fabioborgesoficial.com.br)
**Responsável:** Fábio Borges ou designado

---

## Fluxo 1 — Cadastro novo aluno

| Passo | URL              | Ação                         | Resultado esperado                             |
| ----- | ---------------- | ---------------------------- | ---------------------------------------------- |
| 1     | `/auth/cadastro` | Preencher nome, email, senha | Formulário exibido sem erros                   |
| 2     | —                | Clicar "Criar conta"         | Email de confirmação enviado (verificar caixa) |
| 3     | Email            | Clicar link de confirmação   | Redirecionado para `/auth/login`               |
| 4     | `/auth/login`    | Logar com email/senha        | Redirecionado para `/dashboard`                |
| 5     | `/dashboard`     | —                            | Dashboard exibe "Bem-vindo, {nome}"            |

**Status:** [ ] OK [ ] FALHOU

---

## Fluxo 2 — Login com Google OAuth

| Passo | URL           | Ação                       | Resultado esperado             |
| ----- | ------------- | -------------------------- | ------------------------------ |
| 1     | `/auth/login` | Clicar "Entrar com Google" | Popup/redirect Google OAuth    |
| 2     | Google        | Autorizar                  | Callback processado            |
| 3     | `/dashboard`  | —                          | Dashboard exibe nome do Google |

**Status:** [ ] OK [ ] FALHOU

---

## Fluxo 3 — Catálogo público (não autenticado)

| Passo | URL              | Ação                         | Resultado esperado                            |
| ----- | ---------------- | ---------------------------- | --------------------------------------------- |
| 1     | `/cursos`        | Visitar sem login            | Lista de cursos publicados exibida            |
| 2     | `/cursos/[slug]` | Clicar em um curso           | Página de detalhe com módulos/aulas           |
| 3     | —                | Clicar "Quero me matricular" | Redirecionado para `/auth/login?redirect=...` |

**Status:** [ ] OK [ ] FALHOU

---

## Fluxo 4 — Checkout curso via Stripe

| Passo | URL                 | Ação                                         | Resultado esperado                                             |
| ----- | ------------------- | -------------------------------------------- | -------------------------------------------------------------- |
| 1     | `/auth/login`       | Logar como aluno teste                       | Dashboard                                                      |
| 2     | `/cursos/[slug]`    | Clicar "Quero me matricular"                 | Stripe Checkout abre                                           |
| 3     | Stripe              | Pagar com cartão teste `4242 4242 4242 4242` | Processado com sucesso                                         |
| 4     | `/checkout/sucesso` | —                                            | Mensagem de confirmação exibida                                |
| 5     | —                   | Aguardar ~5s e verificar                     | Enrollment criado na tabela `enrollments` (Supabase Dashboard) |
| 6     | `/dashboard`        | —                                            | Curso aparece em "Meus cursos"                                 |

**Status:** [ ] OK [ ] FALHOU

---

## Fluxo 5 — Player + progresso de aula

| Passo | URL                | Ação                        | Resultado esperado                   |
| ----- | ------------------ | --------------------------- | ------------------------------------ |
| 1     | `/dashboard`       | Clicar no curso matriculado | Vai para primeira aula               |
| 2     | `/aula/[lessonId]` | Assistir vídeo              | Player Vimeo carregado               |
| 3     | —                  | Assistir >80% do vídeo      | Progresso salvo automaticamente      |
| 4     | —                  | Recarregar página           | Progresso restaurado, barra avançada |

**Status:** [ ] OK [ ] FALHOU

---

## Fluxo 6 — Quiz

| Passo | URL                | Ação                            | Resultado esperado                 |
| ----- | ------------------ | ------------------------------- | ---------------------------------- |
| 1     | `/aula/[lessonId]` | Navegar para aula com quiz      | Quiz exibido ao final da aula      |
| 2     | —                  | Responder todas as questões     | Botão "Enviar" habilitado          |
| 3     | —                  | Clicar "Enviar"                 | Resultado exibido (nota + acertos) |
| 4     | —                  | Verificar acesso à próxima aula | Desbloqueada se aprovado           |

**Status:** [ ] OK [ ] FALHOU

---

## Fluxo 7 — Certificado

| Passo | URL                   | Ação                             | Resultado esperado                                 |
| ----- | --------------------- | -------------------------------- | -------------------------------------------------- |
| 1     | —                     | Concluir todas as aulas do curso | 100% progresso                                     |
| 2     | `/dashboard`          | —                                | Banner "Certificado disponível"                    |
| 3     | —                     | Clicar "Gerar certificado"       | PDF gerado e baixado                               |
| 4     | `/certificado/[uuid]` | Acessar URL pública              | Página de verificação exibe dados do aluno + curso |

**Status:** [ ] OK [ ] FALHOU

---

## Fluxo 8 — Admin: matrícula manual

| Passo | URL             | Ação                                    | Resultado esperado                  |
| ----- | --------------- | --------------------------------------- | ----------------------------------- |
| 1     | `/auth/login`   | Logar como admin                        | Dashboard admin                     |
| 2     | `/admin/alunos` | —                                       | Lista de alunos exibida             |
| 3     | —               | Clicar "Matricular manualmente"         | Modal abre                          |
| 4     | —               | Buscar email do aluno, selecionar curso | Botão "Confirmar" habilitado        |
| 5     | —               | Clicar "Confirmar"                      | Enrollment criado, toast de sucesso |

**Status:** [ ] OK [ ] FALHOU

---

## Fluxo 9 — Admin: gerenciamento de cursos

| Passo | URL             | Ação                                | Resultado esperado                     |
| ----- | --------------- | ----------------------------------- | -------------------------------------- |
| 1     | `/admin/cursos` | —                                   | Lista de cursos com status             |
| 2     | —               | Clicar "Novo curso"                 | Formulário de criação                  |
| 3     | —               | Preencher título, descrição, preço  | —                                      |
| 4     | —               | Clicar "Criar"                      | Curso criado, aparece na lista         |
| 5     | —               | Adicionar módulo ao curso           | Módulo criado                          |
| 6     | —               | Adicionar aula ao módulo (vimeo_id) | Aula criada                            |
| 7     | —               | Publicar curso                      | `published=true`, aparece em `/cursos` |

**Status:** [ ] OK [ ] FALHOU

---

## Fluxo 10 — Planos de assinatura

| Passo | URL           | Ação                               | Resultado esperado                                      |
| ----- | ------------- | ---------------------------------- | ------------------------------------------------------- |
| 1     | `/planos`     | Visitar sem login                  | 4 planos exibidos (Prata, Ouro, Diamante, Macroempresa) |
| 2     | —             | Clicar "Assinar" em qualquer plano | Redireciona para login                                  |
| 3     | `/auth/login` | Logar                              | Volta para `/planos`                                    |
| 4     | `/planos`     | Clicar "Assinar Prata — Mensal"    | Stripe Subscription Checkout abre                       |

**Status:** [ ] OK [ ] FALHOU

---

## Verificações Adicionais

- [ ] `GET /api/health` retorna `{ status: 'ok', ts: "..." }` (200)
- [ ] Headers de segurança presentes: `curl -I https://ead.fabioborgesoficial.com.br | grep -E "X-Frame|X-Content|X-XSS"`
- [ ] Sitemap acessível: `GET /sitemap.xml` retorna 200
- [ ] Robots: `GET /robots.txt` retorna 200
- [ ] HTTPS habilitado, HTTP redireciona para HTTPS
- [ ] UptimeRobot monitorando `/api/health` com alerta ativo

---

**Data do teste:** ****\_\_\_****
**Testado por:** ****\_\_\_****
**Resultado geral:** [ ] APROVADO [ ] FALHOU — detalhar abaixo

Observações:
