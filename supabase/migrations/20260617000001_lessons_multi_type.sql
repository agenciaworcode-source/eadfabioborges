-- Migration: Epic 14 - Lesson Types Multi-formato
-- Story: 14.1
-- Adds lesson_type enum and new columns to lessons table

-- Criar enum de tipos de aula
CREATE TYPE public.lesson_type AS ENUM ('video', 'text', 'pdf', 'embed');

-- Adicionar novas colunas à tabela lessons (backward compatible)
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS type         public.lesson_type NOT NULL DEFAULT 'video',
  ADD COLUMN IF NOT EXISTS content_body text,
  ADD COLUMN IF NOT EXISTS embed_url    text,
  ADD COLUMN IF NOT EXISTS pdf_url      text;
