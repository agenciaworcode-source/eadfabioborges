-- Story 13.1: Adicionar colunas level e category à tabela courses
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS level VARCHAR(20) NOT NULL DEFAULT 'todos'
    CHECK (level IN ('iniciante', 'intermediario', 'avancado', 'todos')),
  ADD COLUMN IF NOT EXISTS category VARCHAR(100);
