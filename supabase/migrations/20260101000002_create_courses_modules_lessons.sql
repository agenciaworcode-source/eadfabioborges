-- Migration 2: courses, modules, lessons

CREATE TABLE public.courses (
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

CREATE TABLE public.modules (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id       uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title           text NOT NULL,
  "order"         integer NOT NULL DEFAULT 0,
  is_free_preview boolean NOT NULL DEFAULT false
);

CREATE TABLE public.lessons (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id     uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title         text NOT NULL,
  vimeo_id      text,
  duration_secs integer DEFAULT 0,
  "order"       integer NOT NULL DEFAULT 0,
  attachments   jsonb DEFAULT '[]'::jsonb
);
