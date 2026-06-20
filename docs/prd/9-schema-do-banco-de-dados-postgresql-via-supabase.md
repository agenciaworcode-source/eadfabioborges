# 9. Schema do Banco de Dados (PostgreSQL via Supabase)

Row Level Security em todas as tabelas — o banco bloqueia, o código não precisa verificar.

| Tabela            | Colunas principais                                                    | RLS principal          |
| ----------------- | --------------------------------------------------------------------- | ---------------------- |
| `users`           | id, email, name, role, plan, avatar_url, created_at                   | Próprio registro       |
| `courses`         | id, slug, title, description, price, is_vip, thumbnail_url, published | Admin escrita          |
| `modules`         | id, course_id, title, order, is_free_preview                          | Admin escrita          |
| `lessons`         | id, module_id, title, vimeo_id, duration_secs, order, attachments     | Enroll ou plano ativo  |
| `enrollments`     | id, user_id, course_id, status, enrolled_at, completed_at             | Próprio registro       |
| `subscriptions`   | id, user_id, plan, status, stripe_sub_id, period_start, period_end    | Próprio registro       |
| `lesson_progress` | id, user_id, lesson_id, completed, watched_secs, updated_at           | Próprio registro       |
| `quizzes`         | id, lesson_id, title, pass_score, attempts_allowed                    | Admin escrita          |
| `questions`       | id, quiz_id, type, body, options (jsonb), correct_answer              | Admin escrita          |
| `quiz_attempts`   | id, user_id, quiz_id, score, answers (jsonb), passed, created_at      | Próprio registro       |
| `assignments`     | id, lesson_id, title, instructions, deadline                          | Admin escrita          |
| `submissions`     | id, user_id, assignment_id, file_url, grade, feedback, graded_at      | Próprio registro       |
| `certificates`    | id (uuid), user_id, course_id, issued_at, pdf_url, verified           | Próprio + público read |

**Regra RLS chave — tabela `lessons`:** SELECT permitido apenas se existe linha em `enrollments` com `course_id` correspondente (curso avulso) OU linha em `subscriptions` com plan compatível e `status='active'`. O código da aplicação não valida — o banco rejeita automaticamente.

---
