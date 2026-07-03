-- ============================================================
-- FULL SETUP — EAD Fábio Borges
-- Idempotente: seguro rodar mesmo que tabelas já existam
-- Cole no SQL Editor do projeto auxsvbkxrpsbfwehccto
-- ============================================================

-- -------------------------------------------------------
-- ENUMS
-- -------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enrollment_status') THEN
    CREATE TYPE public.enrollment_status AS ENUM ('active', 'completed', 'cancelled', 'expired');
  ELSE
    BEGIN ALTER TYPE public.enrollment_status ADD VALUE IF NOT EXISTS 'expired'; EXCEPTION WHEN others THEN NULL; END;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan') THEN
    CREATE TYPE public.subscription_plan AS ENUM ('monthly', 'annual', 'lifetime');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
    CREATE TYPE public.subscription_status AS ENUM ('active', 'past_due', 'cancelled', 'trialing');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_type') THEN
    CREATE TYPE public.question_type AS ENUM ('multiple_choice', 'true_false', 'open', 'fill_in_blanks', 'short_answer', 'matching', 'ordering', 'image_choice');
  ELSE
    BEGIN ALTER TYPE public.question_type ADD VALUE IF NOT EXISTS 'fill_in_blanks'; EXCEPTION WHEN others THEN NULL; END;
    BEGIN ALTER TYPE public.question_type ADD VALUE IF NOT EXISTS 'short_answer'; EXCEPTION WHEN others THEN NULL; END;
    BEGIN ALTER TYPE public.question_type ADD VALUE IF NOT EXISTS 'matching'; EXCEPTION WHEN others THEN NULL; END;
    BEGIN ALTER TYPE public.question_type ADD VALUE IF NOT EXISTS 'ordering'; EXCEPTION WHEN others THEN NULL; END;
    BEGIN ALTER TYPE public.question_type ADD VALUE IF NOT EXISTS 'image_choice'; EXCEPTION WHEN others THEN NULL; END;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lesson_type') THEN
    CREATE TYPE public.lesson_type AS ENUM ('video', 'text', 'pdf', 'embed');
  END IF;
END $$;

-- -------------------------------------------------------
-- TABELA: users
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text NOT NULL UNIQUE,
  name        text NOT NULL,
  role        text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  plan        text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'monthly', 'annual', 'lifetime')),
  avatar_url  text,
  city        text,
  specialty   text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -------------------------------------------------------
-- TABELA: courses
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.courses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text NOT NULL UNIQUE,
  title         text NOT NULL,
  description   text,
  price         numeric(10, 2),
  is_vip        boolean NOT NULL DEFAULT false,
  thumbnail_url text,
  published     boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS level              varchar(20) NOT NULL DEFAULT 'todos',
  ADD COLUMN IF NOT EXISTS category           varchar(100),
  ADD COLUMN IF NOT EXISTS access_type        text NOT NULL DEFAULT 'paid',
  ADD COLUMN IF NOT EXISTS certificate_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS access_days        integer,
  ADD COLUMN IF NOT EXISTS intro_video_url    text,
  ADD COLUMN IF NOT EXISTS what_you_learn     text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS requirements       text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS target_audience    text,
  ADD COLUMN IF NOT EXISTS tags               text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS max_students       integer NOT NULL DEFAULT 0;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'courses_level_check' AND conrelid = 'public.courses'::regclass) THEN
    ALTER TABLE public.courses ADD CONSTRAINT courses_level_check CHECK (level IN ('iniciante', 'intermediario', 'avancado', 'todos'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'courses_access_type_check' AND conrelid = 'public.courses'::regclass) THEN
    ALTER TABLE public.courses ADD CONSTRAINT courses_access_type_check CHECK (access_type IN ('free', 'paid', 'plan', 'manual'));
  END IF;
END $$;

-- -------------------------------------------------------
-- TABELA: modules
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.modules (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id       uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title           text NOT NULL,
  "order"         integer NOT NULL DEFAULT 0,
  is_free_preview boolean NOT NULL DEFAULT false
);

ALTER TABLE public.modules
  ADD COLUMN IF NOT EXISTS description text;

-- -------------------------------------------------------
-- TABELA: lessons
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lessons (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id     uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title         text NOT NULL,
  vimeo_id      text,
  duration_secs integer DEFAULT 0,
  "order"       integer NOT NULL DEFAULT 0,
  attachments   jsonb DEFAULT '[]'::jsonb
);

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS is_free_preview     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS type                public.lesson_type NOT NULL DEFAULT 'video',
  ADD COLUMN IF NOT EXISTS content_body        text,
  ADD COLUMN IF NOT EXISTS embed_url           text,
  ADD COLUMN IF NOT EXISTS pdf_url             text,
  ADD COLUMN IF NOT EXISTS youtube_url         text,
  ADD COLUMN IF NOT EXISTS video_thumbnail_url text,
  ADD COLUMN IF NOT EXISTS completion_percent  integer NOT NULL DEFAULT 0;

-- -------------------------------------------------------
-- TABELA: enrollments
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.enrollments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id     uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  status        public.enrollment_status NOT NULL DEFAULT 'active',
  enrolled_at   timestamptz NOT NULL DEFAULT now(),
  completed_at  timestamptz,
  UNIQUE (user_id, course_id)
);

ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- -------------------------------------------------------
-- TABELA: subscriptions
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan               public.subscription_plan NOT NULL,
  status             public.subscription_status NOT NULL DEFAULT 'active',
  stripe_sub_id      text UNIQUE,
  stripe_customer_id text,
  period_start       timestamptz,
  period_end         timestamptz,
  grace_period_end   timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS mp_payment_id text;

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_mp_payment_id_key
  ON public.subscriptions(mp_payment_id)
  WHERE mp_payment_id IS NOT NULL;

-- -------------------------------------------------------
-- TABELA: lesson_progress
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  lesson_id    uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed    boolean NOT NULL DEFAULT false,
  watched_secs integer NOT NULL DEFAULT 0,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);

ALTER TABLE public.lesson_progress
  ADD COLUMN IF NOT EXISTS resume_position_secs integer NOT NULL DEFAULT 0;

-- -------------------------------------------------------
-- TABELA: quizzes
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quizzes (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id        uuid REFERENCES public.lessons(id) ON DELETE CASCADE,
  title            text NOT NULL,
  pass_score       integer NOT NULL DEFAULT 70,
  attempts_allowed integer NOT NULL DEFAULT 3
);

ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS time_limit_secs     integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS feedback_mode       text NOT NULL DEFAULT 'after_all',
  ADD COLUMN IF NOT EXISTS randomize_questions boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_questions_shown integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS course_id           uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS scope               text NOT NULL DEFAULT 'lesson';

DO $$ BEGIN
  -- Tornar lesson_id nullable (para quizzes de curso)
  BEGIN ALTER TABLE public.quizzes ALTER COLUMN lesson_id DROP NOT NULL; EXCEPTION WHEN others THEN NULL; END;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quizzes_scope_check') THEN
    ALTER TABLE public.quizzes ADD CONSTRAINT quizzes_scope_check CHECK (scope IN ('lesson', 'course'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quizzes_exactly_one_parent_check') THEN
    ALTER TABLE public.quizzes ADD CONSTRAINT quizzes_exactly_one_parent_check
      CHECK (
        (scope = 'lesson' AND lesson_id IS NOT NULL AND course_id IS NULL)
        OR (scope = 'course' AND course_id IS NOT NULL AND lesson_id IS NULL)
      );
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS quizzes_one_course_quiz_idx
  ON public.quizzes(course_id)
  WHERE scope = 'course' AND course_id IS NOT NULL;

-- -------------------------------------------------------
-- TABELA: questions
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.questions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id        uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  type           public.question_type NOT NULL DEFAULT 'multiple_choice',
  body           text NOT NULL,
  options        jsonb DEFAULT '[]'::jsonb,
  correct_answer text
);

ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS question_order integer NOT NULL DEFAULT 0;

-- -------------------------------------------------------
-- TABELA: quiz_attempts
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  quiz_id    uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score      integer NOT NULL DEFAULT 0,
  answers    jsonb DEFAULT '{}'::jsonb,
  passed     boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- -------------------------------------------------------
-- TABELA: assignments
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assignments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id    uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title        text NOT NULL,
  instructions text,
  deadline     timestamptz
);

-- -------------------------------------------------------
-- TABELA: submissions
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.submissions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assignment_id  uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  file_url       text,
  grade          integer,
  feedback       text,
  graded_at      timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- -------------------------------------------------------
-- TABELA: certificates
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.certificates (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id  uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  issued_at  timestamptz NOT NULL DEFAULT now(),
  pdf_url    text,
  verified   boolean NOT NULL DEFAULT false,
  UNIQUE (user_id, course_id)
);

-- -------------------------------------------------------
-- TABELA: plans
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plans (
  id             text PRIMARY KEY,
  name           text NOT NULL,
  price_monthly  integer NOT NULL DEFAULT 0,
  price_annual   integer NOT NULL DEFAULT 0,
  sort_order     integer NOT NULL DEFAULT 0,
  is_active      boolean NOT NULL DEFAULT true,
  updated_at     timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.plans (id, name, price_monthly, price_annual, sort_order) VALUES
  ('free',         'Free',         0,      0,       0),
  ('prata',        'Prata',        9700,   97000,   1),
  ('ouro',         'Ouro',         19700,  197000,  2),
  ('diamante',     'Diamante',     39700,  397000,  3),
  ('macroempresa', 'Macroempresa', 0,      0,       4)
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------
-- TABELA: certificate_templates
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.certificate_templates (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL DEFAULT 'Modelo padrão',
  is_default       boolean NOT NULL DEFAULT false,
  title            text NOT NULL DEFAULT 'Certificado de Conclusão',
  body_template    text NOT NULL DEFAULT 'Certificamos que {{student_name}} concluiu com aproveitamento o curso {{course_name}}.',
  issuer_name      text NOT NULL DEFAULT 'Fábio Borges',
  issuer_role      text NOT NULL DEFAULT 'Mentor · Fábio Borges Mentoria',
  signature_url    text,
  logo_url         text,
  background_url   text,
  primary_color    text NOT NULL DEFAULT '#48a1fe',
  layout_config    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS certificate_templates_single_default
  ON public.certificate_templates (is_default)
  WHERE is_default = true;

-- -------------------------------------------------------
-- ENABLE RLS
-- -------------------------------------------------------
ALTER TABLE public.users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------
-- HELPERS
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.has_lesson_access(p_lesson_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.lessons l
    JOIN public.modules m ON m.id = l.module_id
    JOIN public.enrollments e ON e.course_id = m.course_id
    WHERE l.id = p_lesson_id
      AND e.user_id = auth.uid()
      AND e.status = 'active'
      AND (e.expires_at IS NULL OR e.expires_at > now())
  )
  OR EXISTS (
    SELECT 1 FROM public.lessons l
    JOIN public.modules m ON m.id = l.module_id
    JOIN public.courses c ON c.id = m.course_id
    JOIN public.subscriptions s ON s.user_id = auth.uid()
    WHERE l.id = p_lesson_id
      AND c.is_vip = true
      AND s.status = 'active'
      AND s.period_end > now()
  )
  OR EXISTS (
    SELECT 1 FROM public.lessons l
    JOIN public.modules m ON m.id = l.module_id
    WHERE l.id = p_lesson_id AND m.is_free_preview = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.set_certificate_template_updated_at()
RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_certificate_template_updated_at ON public.certificate_templates;
CREATE TRIGGER set_certificate_template_updated_at
  BEFORE UPDATE ON public.certificate_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_certificate_template_updated_at();

-- -------------------------------------------------------
-- RLS POLICIES (drop antes de recriar para idempotência)
-- -------------------------------------------------------
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- users
CREATE POLICY "users_select_own"  ON public.users FOR SELECT USING (id = auth.uid() OR is_admin());
CREATE POLICY "users_update_own"  ON public.users FOR UPDATE USING (id = auth.uid());

-- courses
CREATE POLICY "courses_read_published" ON public.courses FOR SELECT USING (published = true OR is_admin());
CREATE POLICY "courses_insert_admin"   ON public.courses FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "courses_update_admin"   ON public.courses FOR UPDATE USING (is_admin());
CREATE POLICY "courses_delete_admin"   ON public.courses FOR DELETE USING (is_admin());

-- modules
CREATE POLICY "modules_read"       ON public.modules FOR SELECT USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND (c.published = true OR is_admin())));
CREATE POLICY "modules_write_admin" ON public.modules FOR ALL USING (is_admin());

-- lessons
CREATE POLICY "lessons_select"     ON public.lessons FOR SELECT USING (has_lesson_access(id));
CREATE POLICY "lessons_write_admin" ON public.lessons FOR ALL USING (is_admin());

-- enrollments
CREATE POLICY "enrollments_select_own"    ON public.enrollments FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "enrollments_insert_own"    ON public.enrollments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "enrollments_update_admin"  ON public.enrollments FOR UPDATE USING (is_admin());

-- subscriptions
CREATE POLICY "subscriptions_select_own"     ON public.subscriptions FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "subscriptions_insert_service" ON public.subscriptions FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "subscriptions_update_admin"   ON public.subscriptions FOR UPDATE USING (is_admin());

-- lesson_progress
CREATE POLICY "progress_select_own" ON public.lesson_progress FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "progress_upsert_own" ON public.lesson_progress FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "progress_update_own" ON public.lesson_progress FOR UPDATE USING (user_id = auth.uid());

-- quizzes & questions
CREATE POLICY "quizzes_read"         ON public.quizzes FOR SELECT USING (true);
CREATE POLICY "quizzes_write_admin"  ON public.quizzes FOR ALL USING (is_admin());
CREATE POLICY "questions_read"       ON public.questions FOR SELECT USING (true);
CREATE POLICY "questions_write_admin" ON public.questions FOR ALL USING (is_admin());

-- quiz_attempts
CREATE POLICY "attempts_own" ON public.quiz_attempts FOR ALL USING (user_id = auth.uid());

-- assignments
CREATE POLICY "assignments_read"       ON public.assignments FOR SELECT USING (true);
CREATE POLICY "assignments_write_admin" ON public.assignments FOR ALL USING (is_admin());

-- submissions
CREATE POLICY "submissions_own" ON public.submissions FOR ALL USING (user_id = auth.uid());

-- certificates
CREATE POLICY "certificates_select"        ON public.certificates FOR SELECT USING (user_id = auth.uid() OR verified = true);
CREATE POLICY "certificates_insert_admin"  ON public.certificates FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "certificates_update_admin"  ON public.certificates FOR UPDATE USING (is_admin());

-- plans
CREATE POLICY "plans_read"       ON public.plans FOR SELECT USING (true);
CREATE POLICY "plans_write_admin" ON public.plans FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- certificate_templates
CREATE POLICY "certificate_templates_select_admin" ON public.certificate_templates FOR SELECT USING (is_admin());
CREATE POLICY "certificate_templates_write_admin"  ON public.certificate_templates FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- -------------------------------------------------------
-- INDEXES
-- -------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id   ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user  ON public.lesson_progress(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module_id     ON public.lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_modules_course_id     ON public.modules(course_id);

-- -------------------------------------------------------
-- STORAGE BUCKETS
-- -------------------------------------------------------
INSERT INTO storage.buckets (id, name, public) VALUES ('course-thumbnails', 'course-thumbnails', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('submissions', 'submissions', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('certificate-assets', 'certificate-assets', true) ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------
-- FUNÇÃO: submit_quiz_attempt
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(
  p_quiz_id uuid, p_user_id uuid, p_score integer, p_passed boolean, p_answers jsonb
)
RETURNS TABLE (attempt_id uuid, attempts_used integer, attempts_allowed integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_attempts_allowed integer;
  v_attempts_used    integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || p_quiz_id::text, 0));
  SELECT q.attempts_allowed INTO v_attempts_allowed FROM public.quizzes q WHERE q.id = p_quiz_id;
  IF v_attempts_allowed IS NULL THEN RAISE EXCEPTION 'Quiz não encontrado' USING ERRCODE = 'P0002'; END IF;
  SELECT COUNT(*) INTO v_attempts_used FROM public.quiz_attempts qa WHERE qa.user_id = p_user_id AND qa.quiz_id = p_quiz_id;
  IF v_attempts_used >= v_attempts_allowed THEN RAISE EXCEPTION 'Limite de tentativas atingido' USING ERRCODE = 'P0001'; END IF;
  INSERT INTO public.quiz_attempts (user_id, quiz_id, score, answers, passed)
    VALUES (p_user_id, p_quiz_id, p_score, p_answers, p_passed)
    RETURNING id INTO attempt_id;
  attempts_used := v_attempts_used + 1;
  attempts_allowed := v_attempts_allowed;
  RETURN NEXT;
END;
$$;
