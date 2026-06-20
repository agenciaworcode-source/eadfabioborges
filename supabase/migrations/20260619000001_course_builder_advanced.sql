-- ============================================================
-- Epic 22 — Course Builder Avançado (Tutor LMS Parity)
-- Migration: 20260619000001_course_builder_advanced.sql
-- ============================================================

-- -------------------------------------------------------
-- TABELA: courses — 6 novos campos (slug já existe)
-- -------------------------------------------------------
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS intro_video_url   text,
  ADD COLUMN IF NOT EXISTS what_you_learn    text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS requirements      text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS target_audience   text,
  ADD COLUMN IF NOT EXISTS tags              text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS max_students      integer NOT NULL DEFAULT 0;

-- Garantir unicidade do slug apenas se o constraint ainda não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'courses_slug_key'
      AND conrelid = 'public.courses'::regclass
  ) THEN
    ALTER TABLE public.courses ADD CONSTRAINT courses_slug_key UNIQUE (slug);
  END IF;
END $$;

-- -------------------------------------------------------
-- TABELA: modules — 1 novo campo
-- -------------------------------------------------------
ALTER TABLE public.modules
  ADD COLUMN IF NOT EXISTS description text;

-- -------------------------------------------------------
-- TABELA: lessons — 4 novos campos
-- (is_free_preview adicionado aqui pois não está no database.ts)
-- -------------------------------------------------------
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS is_free_preview       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS youtube_url           text,
  ADD COLUMN IF NOT EXISTS video_thumbnail_url   text,
  ADD COLUMN IF NOT EXISTS completion_percent    integer NOT NULL DEFAULT 0;

-- -------------------------------------------------------
-- TABELA: quizzes — 4 novos campos
-- -------------------------------------------------------
ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS time_limit_secs      integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS feedback_mode        text    NOT NULL DEFAULT 'after_all',
  ADD COLUMN IF NOT EXISTS randomize_questions  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_questions_shown  integer NOT NULL DEFAULT 0;

-- -------------------------------------------------------
-- TABELA: questions — 1 novo campo + novos valores no enum
-- -------------------------------------------------------
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS question_order integer NOT NULL DEFAULT 0;

-- Adicionar novos valores ao enum question_type
-- (IF NOT EXISTS requer Postgres 14+; Supabase usa Postgres 15+)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'public.question_type'::regtype
      AND enumlabel = 'fill_in_blanks'
  ) THEN
    ALTER TYPE public.question_type ADD VALUE 'fill_in_blanks';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'public.question_type'::regtype
      AND enumlabel = 'short_answer'
  ) THEN
    ALTER TYPE public.question_type ADD VALUE 'short_answer';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'public.question_type'::regtype
      AND enumlabel = 'matching'
  ) THEN
    ALTER TYPE public.question_type ADD VALUE 'matching';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'public.question_type'::regtype
      AND enumlabel = 'ordering'
  ) THEN
    ALTER TYPE public.question_type ADD VALUE 'ordering';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'public.question_type'::regtype
      AND enumlabel = 'image_choice'
  ) THEN
    ALTER TYPE public.question_type ADD VALUE 'image_choice';
  END IF;
END $$;

-- -------------------------------------------------------
-- TABELA: lesson_progress — auto-resume position
-- -------------------------------------------------------
ALTER TABLE public.lesson_progress
  ADD COLUMN IF NOT EXISTS resume_position_secs integer NOT NULL DEFAULT 0;
