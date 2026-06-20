-- Migration 5: quizzes, questions, quiz_attempts, assignments, submissions, certificates

CREATE TYPE question_type AS ENUM ('multiple_choice', 'true_false', 'open');

CREATE TABLE public.quizzes (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id        uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title            text NOT NULL,
  pass_score       integer NOT NULL DEFAULT 70,
  attempts_allowed integer NOT NULL DEFAULT 3
);

CREATE TABLE public.questions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id        uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  type           question_type NOT NULL DEFAULT 'multiple_choice',
  body           text NOT NULL,
  options        jsonb DEFAULT '[]'::jsonb,
  correct_answer text
);

CREATE TABLE public.quiz_attempts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  quiz_id    uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score      integer NOT NULL DEFAULT 0,
  answers    jsonb DEFAULT '{}'::jsonb,
  passed     boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.assignments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id    uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title        text NOT NULL,
  instructions text,
  deadline     timestamptz
);

CREATE TABLE public.submissions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assignment_id  uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  file_url       text,
  grade          integer,
  feedback       text,
  graded_at      timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.certificates (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id  uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  issued_at  timestamptz NOT NULL DEFAULT now(),
  pdf_url    text,
  verified   boolean NOT NULL DEFAULT false,
  UNIQUE (user_id, course_id)
);
