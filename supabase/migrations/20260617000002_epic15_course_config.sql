-- Epic 15 - Story 15.1: Course Config Fields
-- Adds access_type, certificate_enabled, access_days to courses
-- Adds expires_at to enrollments

-- courses: tipo de acesso
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS access_type text NOT NULL DEFAULT 'paid'
    CONSTRAINT courses_access_type_check CHECK (access_type IN ('free', 'paid', 'plan', 'manual')),
  ADD COLUMN IF NOT EXISTS certificate_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS access_days integer;  -- NULL = vitalicio

-- enrollments: expiracao de acesso
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;  -- NULL = sem expiracao
