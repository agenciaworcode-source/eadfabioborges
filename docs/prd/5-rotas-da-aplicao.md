# 5. Rotas da Aplicação

| Rota                        | Descrição                                  | Acesso        | Sprint |
| --------------------------- | ------------------------------------------ | ------------- | ------ |
| `/`                         | Landing institucional + cursos em destaque | Público       | S1     |
| `/cursos`                   | Catálogo de cursos abertos                 | Público       | S1     |
| `/cursos/[slug]`            | Página de venda do curso                   | Público       | S2     |
| `/planos`                   | Cards dos 4 planos de mentoria             | Público       | S3     |
| `/auth/login`               | Login + OAuth Google                       | Público       | S2     |
| `/auth/cadastro`            | Cadastro                                   | Público       | S2     |
| `/auth/recuperar-senha`     | Recuperação de senha                       | Público       | S2     |
| `/dashboard`                | Dashboard do aluno — cursos e progresso    | Autenticado   | S2     |
| `/dashboard/perfil`         | Editar dados pessoais                      | Autenticado   | S2     |
| `/dashboard/plano`          | Plano ativo + benefícios                   | Autenticado   | S2     |
| `/dashboard/curso/[id]`     | Player + aulas + progresso + quiz          | Matriculado   | S4     |
| `/dashboard/certificados`   | Listar e baixar certificados               | Autenticado   | S5     |
| `/certificado/[uuid]`       | Verificação pública do certificado         | Público       | S5     |
| `/checkout/[produto]`       | Stripe Checkout Session                    | Opcional auth | S3     |
| `/checkout/sucesso`         | Página de sucesso pós-pagamento            | Público       | S3     |
| `/checkout/cancelado`       | Página de cancelamento                     | Público       | S3     |
| `/api/webhooks/stripe`      | Webhook pagamento → libera acesso          | Sistema       | S3     |
| `/api/webhooks/mercadopago` | Webhook PIX                                | Sistema       | S3     |
| `/admin`                    | Painel admin                               | Admin         | S6     |
| `/admin/alunos`             | Gerenciar alunos                           | Admin         | S6     |
| `/admin/cursos`             | CRUD cursos/módulos/aulas                  | Admin         | S6     |
| `/admin/tarefas/[id]`       | Corrigir tarefas práticas                  | Admin         | S6     |
| `/admin/relatorios`         | Receita, conclusão, inativos               | Admin         | S6     |

---
