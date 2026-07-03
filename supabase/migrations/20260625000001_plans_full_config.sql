-- Migration: plans_full_config
-- Adiciona colunas de configuração completa à tabela plans,
-- cria tabela plan_courses e atualiza has_lesson_access.

-- 1. Adicionar colunas à tabela plans
ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS description       text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS features          text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS badge             text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS audience          text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS hierarchy_level   integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_featured       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS includes_all_courses boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS billing_options   text[] NOT NULL DEFAULT '{monthly,annual}';

-- 2. Tabela plan_courses (quais cursos cada plano inclui quando includes_all_courses=false)
CREATE TABLE IF NOT EXISTS public.plan_courses (
  plan_id    text NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  course_id  uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  added_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (plan_id, course_id)
);
ALTER TABLE public.plan_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read plan_courses" ON public.plan_courses FOR SELECT USING (true);
CREATE POLICY "Admin write plan_courses" ON public.plan_courses FOR ALL
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- 3. Seed dados dos planos existentes com valores corretos
UPDATE public.plans SET
  description = 'O ponto de partida ideal para quem quer dominar a eletrotermoterapia aplicada à estética com base científica.',
  features = ARRAY[
    'Plataforma com videoconferências, vídeoaulas e palestras online',
    'Material complementar digital (apostilas, artigos científicos e livros)',
    'Acesso a todos os cursos da plataforma',
    'Certificado digital em cada trilha concluída'
  ],
  badge = 'plan-prata',
  audience = 'Estudantes e iniciantes na área da estética',
  hierarchy_level = 1,
  is_featured = false,
  includes_all_courses = true,
  billing_options = ARRAY['monthly','annual']
WHERE id = 'prata';

UPDATE public.plans SET
  description = 'Para quem já atua na área e quer elevar o nível com suporte direto do mentor em dias e horários comerciais.',
  features = ARRAY[
    'Tudo do Prata',
    'Telefone exclusivo do mentor (ligação e videochamada em horário comercial)',
    'E-mail exclusivo para dúvidas, orientações e material de estudo'
  ],
  badge = 'plan-ouro',
  audience = 'Profissionais liberais e professores de estética',
  hierarchy_level = 2,
  is_featured = true,
  includes_all_courses = true,
  billing_options = ARRAY['monthly','annual']
WHERE id = 'ouro';

UPDATE public.plans SET
  description = 'Presença do mentor dentro da sua clínica: planejamento de arsenal, treinamento de equipe e visita presencial.',
  features = ARRAY[
    'Tudo do Ouro',
    'Reunião particular online a cada 60 dias (planejamento de clínica, até 60 min)',
    'Treinamento online particular para equipamentos a cada 60 dias (até 60 min)',
    'Possibilidade de visita física ao local de trabalho (sujeito a disponibilidade)',
    'Uso do Selo "MENTORIA FÁBIO BORGES" nos materiais da clínica'
  ],
  badge = 'plan-diamante',
  audience = 'Microempreendedores — clínicas e consultórios',
  hierarchy_level = 3,
  is_featured = false,
  includes_all_courses = true,
  billing_options = ARRAY['monthly','annual']
WHERE id = 'diamante';

UPDATE public.plans SET
  description = 'Parceria estratégica para redes, franquias e indústrias de equipamentos eletrotermoterapêuticos.',
  features = ARRAY[
    'Tudo do Diamante',
    '6 reuniões anuais online (equipamentos, cosméticos, pesquisa — até 90 min cada)',
    '6 treinamentos online anuais para uso de equipamentos (até 90 min cada)',
    '2 visitas físicas gratuitas de 4h ou 1 de 8h por ano',
    '2 palestras em congressos/eventos por ano (até 1h cada)',
    'Uso do nome e imagem do mentor em material publicitário da empresa'
  ],
  badge = 'plan-diamante',
  audience = 'Grandes empresas do setor estético',
  hierarchy_level = 4,
  is_featured = false,
  includes_all_courses = true,
  billing_options = ARRAY['monthly','annual']
WHERE id = 'macroempresa';

-- 4. Atualizar has_lesson_access para respeitar includes_all_courses + plan_courses
CREATE OR REPLACE FUNCTION public.has_lesson_access(p_lesson_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    -- Matrícula direta no curso (compra avulsa ou manual)
    SELECT 1
    FROM public.lessons l
    JOIN public.modules m ON m.id = l.module_id
    JOIN public.enrollments e ON e.course_id = m.course_id
    WHERE l.id = p_lesson_id
      AND e.user_id = auth.uid()
      AND e.status IN ('active', 'completed')
      AND (e.expires_at IS NULL OR e.expires_at > now())
  )
  OR EXISTS (
    -- Assinatura ativa com includes_all_courses = true (acessa todos os cursos publicados)
    SELECT 1
    FROM public.lessons l
    JOIN public.modules m ON m.id = l.module_id
    JOIN public.courses c ON c.id = m.course_id
    JOIN public.subscriptions s ON s.user_id = auth.uid()
    JOIN public.plans p ON p.id = s.plan_tier
    WHERE l.id = p_lesson_id
      AND c.published = true
      AND s.status = 'active'
      AND s.period_end > now()
      AND p.includes_all_courses = true
      AND p.is_active = true
  )
  OR EXISTS (
    -- Assinatura ativa com includes_all_courses = false (acessa cursos específicos do plano)
    SELECT 1
    FROM public.lessons l
    JOIN public.modules m ON m.id = l.module_id
    JOIN public.subscriptions s ON s.user_id = auth.uid()
    JOIN public.plans p ON p.id = s.plan_tier
    JOIN public.plan_courses pc ON pc.plan_id = p.id AND pc.course_id = m.course_id
    WHERE l.id = p_lesson_id
      AND s.status = 'active'
      AND s.period_end > now()
      AND p.includes_all_courses = false
      AND p.is_active = true
  )
  OR EXISTS (
    -- Preview gratuito
    SELECT 1
    FROM public.lessons l
    JOIN public.modules m ON m.id = l.module_id
    WHERE l.id = p_lesson_id
      AND m.is_free_preview = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
