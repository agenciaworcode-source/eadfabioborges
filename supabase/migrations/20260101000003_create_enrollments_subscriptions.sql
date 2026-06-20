-- Migration 3: enrollments, subscriptions

CREATE TYPE enrollment_status AS ENUM ('active', 'completed', 'cancelled');
CREATE TYPE subscription_plan AS ENUM ('monthly', 'annual', 'lifetime');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'cancelled', 'trialing');

CREATE TABLE public.enrollments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id     uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  status        enrollment_status NOT NULL DEFAULT 'active',
  enrolled_at   timestamptz NOT NULL DEFAULT now(),
  completed_at  timestamptz,
  UNIQUE (user_id, course_id)
);

CREATE TABLE public.subscriptions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan              subscription_plan NOT NULL,
  status            subscription_status NOT NULL DEFAULT 'active',
  stripe_sub_id     text UNIQUE,
  stripe_customer_id text,
  period_start      timestamptz,
  period_end        timestamptz,
  grace_period_end  timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
);
