-- Fix: adiciona coluna is_free_preview à tabela lessons
-- Esta coluna existia em modules mas estava faltando em lessons,
-- causando falha em todas as operações de criação/edição de aulas.

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS is_free_preview boolean NOT NULL DEFAULT false;

-- Garante também que courses tem level e category (caso migration anterior não foi aplicada)
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS level VARCHAR(20) NOT NULL DEFAULT 'todos'
    CHECK (level IN ('iniciante', 'intermediario', 'avancado', 'todos')),
  ADD COLUMN IF NOT EXISTS category VARCHAR(100);
