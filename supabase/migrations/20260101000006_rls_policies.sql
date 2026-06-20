-- Migration 6: RLS policies + performance indexes

-- ============================================================
-- ENABLE RLS on all tables
-- ============================================================
ALTER TABLE public.users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates      ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER: check if user is admin
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- HELPER: check if user has access to a lesson
-- via enrollment OR active subscription
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_lesson_access(p_lesson_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    -- Access via course enrollment
    SELECT 1
    FROM public.lessons l
    JOIN public.modules m ON m.id = l.module_id
    JOIN public.enrollments e ON e.course_id = m.course_id
    WHERE l.id = p_lesson_id
      AND e.user_id = auth.uid()
      AND e.status = 'active'
  )
  OR EXISTS (
    -- Access via active subscription (VIP plan covers vip courses)
    SELECT 1
    FROM public.lessons l
    JOIN public.modules m ON m.id = l.module_id
    JOIN public.courses c ON c.id = m.course_id
    JOIN public.subscriptions s ON s.user_id = auth.uid()
    WHERE l.id = p_lesson_id
      AND c.is_vip = true
      AND s.status = 'active'
      AND s.period_end > now()
  )
  OR EXISTS (
    -- Free preview lessons are always accessible
    SELECT 1
    FROM public.lessons l
    JOIN public.modules m ON m.id = l.module_id
    WHERE l.id = p_lesson_id
      AND m.is_free_preview = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- users
-- ============================================================
CREATE POLICY "users_select_own"   ON public.users FOR SELECT USING (id = auth.uid() OR is_admin());
CREATE POLICY "users_update_own"   ON public.users FOR UPDATE USING (id = auth.uid());

-- ============================================================
-- courses — public read, admin write
-- ============================================================
CREATE POLICY "courses_read_published" ON public.courses FOR SELECT USING (published = true OR is_admin());
CREATE POLICY "courses_insert_admin"   ON public.courses FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "courses_update_admin"   ON public.courses FOR UPDATE USING (is_admin());
CREATE POLICY "courses_delete_admin"   ON public.courses FOR DELETE USING (is_admin());

-- ============================================================
-- modules — public read (if course published), admin write
-- ============================================================
CREATE POLICY "modules_read" ON public.modules FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND (c.published = true OR is_admin()))
);
CREATE POLICY "modules_write_admin" ON public.modules FOR ALL USING (is_admin());

-- ============================================================
-- lessons — enrollment or subscription gate (CRITICAL RLS)
-- ============================================================
CREATE POLICY "lessons_select" ON public.lessons FOR SELECT USING (has_lesson_access(id));
CREATE POLICY "lessons_write_admin" ON public.lessons FOR ALL USING (is_admin());

-- ============================================================
-- enrollments — own record
-- ============================================================
CREATE POLICY "enrollments_select_own" ON public.enrollments FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "enrollments_insert_own" ON public.enrollments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "enrollments_update_admin" ON public.enrollments FOR UPDATE USING (is_admin());

-- ============================================================
-- subscriptions — own record
-- ============================================================
CREATE POLICY "subscriptions_select_own" ON public.subscriptions FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "subscriptions_insert_service" ON public.subscriptions FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "subscriptions_update_admin" ON public.subscriptions FOR UPDATE USING (is_admin());

-- ============================================================
-- lesson_progress — own record
-- ============================================================
CREATE POLICY "progress_select_own" ON public.lesson_progress FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "progress_upsert_own" ON public.lesson_progress FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "progress_update_own" ON public.lesson_progress FOR UPDATE USING (user_id = auth.uid());

-- ============================================================
-- quizzes & questions — public read, admin write
-- ============================================================
CREATE POLICY "quizzes_read" ON public.quizzes FOR SELECT USING (true);
CREATE POLICY "quizzes_write_admin" ON public.quizzes FOR ALL USING (is_admin());
CREATE POLICY "questions_read" ON public.questions FOR SELECT USING (true);
CREATE POLICY "questions_write_admin" ON public.questions FOR ALL USING (is_admin());

-- ============================================================
-- quiz_attempts — own record
-- ============================================================
CREATE POLICY "attempts_own" ON public.quiz_attempts FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- assignments — public read, admin write
-- ============================================================
CREATE POLICY "assignments_read" ON public.assignments FOR SELECT USING (true);
CREATE POLICY "assignments_write_admin" ON public.assignments FOR ALL USING (is_admin());

-- ============================================================
-- submissions — own record
-- ============================================================
CREATE POLICY "submissions_own" ON public.submissions FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- certificates — own + public read by UUID
-- ============================================================
CREATE POLICY "certificates_select" ON public.certificates FOR SELECT USING (user_id = auth.uid() OR verified = true);
CREATE POLICY "certificates_insert_admin" ON public.certificates FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "certificates_update_admin" ON public.certificates FOR UPDATE USING (is_admin());

-- ============================================================
-- PERFORMANCE INDEXES (4 críticos)
-- ============================================================
CREATE INDEX idx_enrollments_user_id    ON public.enrollments(user_id);
CREATE INDEX idx_enrollments_course_id  ON public.enrollments(course_id);
CREATE INDEX idx_subscriptions_user_id  ON public.subscriptions(user_id, status);
CREATE INDEX idx_lesson_progress_user   ON public.lesson_progress(user_id, lesson_id);
CREATE INDEX idx_lessons_module_id      ON public.lessons(module_id);
CREATE INDEX idx_modules_course_id      ON public.modules(course_id);
