-- Seed de desenvolvimento — cursos reais do catálogo Fábio Borges
-- Roda com service_role (bypass RLS)

-- ============================================================
-- CURSOS
-- ============================================================
INSERT INTO public.courses (id, slug, title, description, price, is_vip, published) VALUES
  (
    'a1000000-0000-0000-0000-000000000001',
    'ultrassom-micro-macrofocado',
    'Ultrassom Micro e Macrofocado',
    'Técnicas avançadas de ultrassom focado para tratamentos estéticos corporais e faciais.',
    1399.90, false, true
  ),
  (
    'a1000000-0000-0000-0000-000000000002',
    'fotodepilacao-laser',
    'Fotodepilação a Laser',
    'Protocolo completo de fotodepilação a laser para todos os fototipos.',
    350.00, false, true
  ),
  (
    'a1000000-0000-0000-0000-000000000003',
    'jato-de-plasma',
    'Jato de Plasma (Atualizado 2024)',
    'Técnica de jato de plasma para rejuvenescimento e tratamento de lesões cutâneas.',
    497.00, false, true
  );

-- ============================================================
-- MÓDULOS (2 por curso)
-- ============================================================
INSERT INTO public.modules (id, course_id, title, "order", is_free_preview) VALUES
  -- Ultrassom
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Fundamentos do Ultrassom', 1, true),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Protocolos Clínicos', 2, false),
  -- Fotodepilação
  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', 'Fundamentos da Fotodepilação', 1, true),
  ('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002', 'Técnica e Parâmetros', 2, false),
  -- Jato de Plasma
  ('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000003', 'Introdução ao Plasma', 1, true),
  ('b1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000003', 'Aplicações Práticas', 2, false);

-- ============================================================
-- AULAS (5 por módulo = 30 aulas total)
-- vimeo_id é placeholder para dev
-- ============================================================
INSERT INTO public.lessons (module_id, title, vimeo_id, duration_secs, "order") VALUES
  -- Módulo 1: Fundamentos do Ultrassom
  ('b1000000-0000-0000-0000-000000000001', 'Introdução e Histórico', 'dev-001', 600, 1),
  ('b1000000-0000-0000-0000-000000000001', 'Física do Ultrassom', 'dev-002', 900, 2),
  ('b1000000-0000-0000-0000-000000000001', 'Equipamentos e Configurações', 'dev-003', 720, 3),
  ('b1000000-0000-0000-0000-000000000001', 'Indicações e Contraindicações', 'dev-004', 540, 4),
  ('b1000000-0000-0000-0000-000000000001', 'Segurança e Biossegurança', 'dev-005', 480, 5),
  -- Módulo 2: Protocolos Clínicos
  ('b1000000-0000-0000-0000-000000000002', 'Protocolo Facial Básico', 'dev-006', 1200, 1),
  ('b1000000-0000-0000-0000-000000000002', 'Protocolo Corporal', 'dev-007', 1080, 2),
  ('b1000000-0000-0000-0000-000000000002', 'Combinação com Outros Recursos', 'dev-008', 900, 3),
  ('b1000000-0000-0000-0000-000000000002', 'Casos Clínicos — Parte 1', 'dev-009', 1440, 4),
  ('b1000000-0000-0000-0000-000000000002', 'Casos Clínicos — Parte 2', 'dev-010', 1440, 5),
  -- Módulo 3: Fundamentos da Fotodepilação
  ('b1000000-0000-0000-0000-000000000003', 'Fototermólise Seletiva', 'dev-011', 720, 1),
  ('b1000000-0000-0000-0000-000000000003', 'Fototipos de Fitzpatrick', 'dev-012', 600, 2),
  ('b1000000-0000-0000-0000-000000000003', 'Comprimentos de Onda', 'dev-013', 540, 3),
  ('b1000000-0000-0000-0000-000000000003', 'Ciclo do Folículo Piloso', 'dev-014', 480, 4),
  ('b1000000-0000-0000-0000-000000000003', 'Avaliação do Paciente', 'dev-015', 660, 5),
  -- Módulo 4: Técnica e Parâmetros
  ('b1000000-0000-0000-0000-000000000004', 'Parâmetros por Região', 'dev-016', 900, 1),
  ('b1000000-0000-0000-0000-000000000004', 'Técnica de Aplicação', 'dev-017', 1080, 2),
  ('b1000000-0000-0000-0000-000000000004', 'Manejo de Efeitos Adversos', 'dev-018', 720, 3),
  ('b1000000-0000-0000-0000-000000000004', 'Cuidados Pós-Procedimento', 'dev-019', 480, 4),
  ('b1000000-0000-0000-0000-000000000004', 'Estudo de Casos Reais', 'dev-020', 1320, 5),
  -- Módulo 5: Introdução ao Plasma
  ('b1000000-0000-0000-0000-000000000005', 'O que é Jato de Plasma?', 'dev-021', 600, 1),
  ('b1000000-0000-0000-0000-000000000005', 'Mecanismo de Ação', 'dev-022', 720, 2),
  ('b1000000-0000-0000-0000-000000000005', 'Equipamentos Disponíveis', 'dev-023', 660, 3),
  ('b1000000-0000-0000-0000-000000000005', 'Indicações Clínicas', 'dev-024', 540, 4),
  ('b1000000-0000-0000-0000-000000000005', 'Contraindicações e Riscos', 'dev-025', 480, 5),
  -- Módulo 6: Aplicações Práticas
  ('b1000000-0000-0000-0000-000000000006', 'Técnica Palpebral Superior', 'dev-026', 1200, 1),
  ('b1000000-0000-0000-0000-000000000006', 'Tratamento de Manchas', 'dev-027', 900, 2),
  ('b1000000-0000-0000-0000-000000000006', 'Cicatrizes e Lesões', 'dev-028', 1080, 3),
  ('b1000000-0000-0000-0000-000000000006', 'Cuidados no Pós-Procedimento', 'dev-029', 600, 4),
  ('b1000000-0000-0000-0000-000000000006', 'Casos Reais e Resultados', 'dev-030', 1440, 5);
