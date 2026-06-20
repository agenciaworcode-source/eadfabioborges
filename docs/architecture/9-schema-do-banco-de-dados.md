# 9. Schema do Banco de Dados

O schema completo está documentado em `docs/prd.md` §9. Abaixo as migrações SQL estruturadas para Supabase CLI.

## 9.1 Migrations (ordem de execução)

```
supabase/migrations/
├── 20260101000001_create_users.sql
├── 20260101000002_create_courses_modules_lessons.sql
├── 20260101000003_create_enrollments_subscriptions.sql
├── 20260101000004_create_progress_quizzes.sql
├── 20260101000005_create_assignments_certificates.sql
└── 20260101000006_rls_policies_all_tables.sql
```

## 9.2 RLS Policies Críticas

```sql
-- =====================================================
-- LESSONS: acesso apenas com enrollment OU subscription
-- =====================================================
CREATE POLICY "lessons_select" ON lessons FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM enrollments e
    JOIN modules m ON m.id = lessons.module_id
    WHERE e.user_id = auth.uid()
      AND e.course_id = m.course_id
      AND e.status IN ('active', 'completed')
  )
  OR
  EXISTS (
    SELECT 1 FROM subscriptions s
    WHERE s.user_id = auth.uid()
      AND s.status = 'active'
      AND s.period_end > now()
  )
);

-- =====================================================
-- ENROLLMENTS: aluno vê apenas os próprios
-- =====================================================
CREATE POLICY "enrollments_select" ON enrollments FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "enrollments_insert" ON enrollments FOR INSERT
WITH CHECK (auth.uid() IN (
  SELECT id FROM users WHERE role = 'admin'
) OR user_id = auth.uid()); -- webhook usa service_role (bypass RLS)

-- =====================================================
-- COURSES: qualquer um lê, só admin escreve
-- =====================================================
CREATE POLICY "courses_read" ON courses FOR SELECT USING (published = true OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "courses_write" ON courses FOR ALL
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
```

## 9.3 Índices Críticos para Performance

```sql
-- Lookup mais frequente: progresso de aluno por curso
CREATE INDEX idx_lesson_progress_user_lesson ON lesson_progress(user_id, lesson_id);

-- Verificação de enrollment em RLS
CREATE INDEX idx_enrollments_user_course ON enrollments(user_id, course_id);

-- Verificação de subscription ativa
CREATE INDEX idx_subscriptions_user_status ON subscriptions(user_id, status, period_end);

-- Certificados por aluno
CREATE INDEX idx_certificates_user ON certificates(user_id);
```

---
