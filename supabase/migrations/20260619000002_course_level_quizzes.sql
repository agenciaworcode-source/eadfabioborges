-- Course-level quizzes / final assessments.
-- Keeps existing lesson quizzes working while allowing one general quiz per course.

ALTER TABLE public.quizzes
  ALTER COLUMN lesson_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'lesson';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'quizzes_scope_check'
  ) THEN
    ALTER TABLE public.quizzes
      ADD CONSTRAINT quizzes_scope_check
      CHECK (scope IN ('lesson', 'course'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'quizzes_exactly_one_parent_check'
  ) THEN
    ALTER TABLE public.quizzes
      ADD CONSTRAINT quizzes_exactly_one_parent_check
      CHECK (
        (scope = 'lesson' AND lesson_id IS NOT NULL AND course_id IS NULL)
        OR
        (scope = 'course' AND course_id IS NOT NULL AND lesson_id IS NULL)
      );
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS quizzes_one_course_quiz_idx
  ON public.quizzes(course_id)
  WHERE scope = 'course' AND course_id IS NOT NULL;
