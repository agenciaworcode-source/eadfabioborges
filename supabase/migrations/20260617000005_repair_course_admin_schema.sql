-- Repair migration: ensure current course admin/player schema exists.
-- Safe to run more than once after partial/manual migration application.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lesson_type') THEN
    CREATE TYPE public.lesson_type AS ENUM ('video', 'text', 'pdf', 'embed');
  END IF;
END $$;

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS level varchar(20) NOT NULL DEFAULT 'todos',
  ADD COLUMN IF NOT EXISTS category varchar(100),
  ADD COLUMN IF NOT EXISTS access_type text NOT NULL DEFAULT 'paid',
  ADD COLUMN IF NOT EXISTS certificate_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS access_days integer;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'courses_level_check'
      AND conrelid = 'public.courses'::regclass
  ) THEN
    ALTER TABLE public.courses
      ADD CONSTRAINT courses_level_check
      CHECK (level IN ('iniciante', 'intermediario', 'avancado', 'todos'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'courses_access_type_check'
      AND conrelid = 'public.courses'::regclass
  ) THEN
    ALTER TABLE public.courses
      ADD CONSTRAINT courses_access_type_check
      CHECK (access_type IN ('free', 'paid', 'plan', 'manual'));
  END IF;
END $$;

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS is_free_preview boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS type public.lesson_type NOT NULL DEFAULT 'video',
  ADD COLUMN IF NOT EXISTS content_body text,
  ADD COLUMN IF NOT EXISTS embed_url text,
  ADD COLUMN IF NOT EXISTS pdf_url text;

ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS mp_payment_id text;

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_mp_payment_id_key
  ON public.subscriptions(mp_payment_id)
  WHERE mp_payment_id IS NOT NULL;
