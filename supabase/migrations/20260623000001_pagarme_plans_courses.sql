-- ============================================================
-- Migration: PagarMe integration + Planos reais + Cursos reais
-- NOTA: courses no banco usa level em PT ('iniciante','intermediario','avancado','todos')
--       e access_type: 'free'|'paid'|'plan'|'manual'
-- ============================================================

-- 1. Adicionar colunas PagarMe na tabela subscriptions
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS plan_tier                 text,      -- 'prata'|'ouro'|'diamante'|'macroempresa'
  ADD COLUMN IF NOT EXISTS billing_period            text DEFAULT 'monthly', -- 'monthly'|'annual'
  ADD COLUMN IF NOT EXISTS pagarme_customer_id       text,
  ADD COLUMN IF NOT EXISTS pagarme_subscription_id   text,
  ADD COLUMN IF NOT EXISTS pagarme_payment_link_id   text;

-- 2. Adicionar colunas PagarMe na tabela enrollments (compras avulsas)
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS pagarme_payment_link_id text,
  ADD COLUMN IF NOT EXISTS pagarme_order_id        text;

-- 3. Upsert dos 4 planos de mentoria
INSERT INTO public.plans (id, name, price_monthly, price_annual, sort_order, is_active)
VALUES
  ('prata',        'Prata',         99700,   997000,   1, true),
  ('ouro',         'Ouro',         197000,  1970000,   2, true),
  ('diamante',     'Diamante',     297000,  2970000,   3, true),
  ('macroempresa', 'Macroempresa', 497000,  4970000,   4, true)
ON CONFLICT (id) DO UPDATE SET
  name           = EXCLUDED.name,
  price_monthly  = EXCLUDED.price_monthly,
  price_annual   = EXCLUDED.price_annual,
  sort_order     = EXCLUDED.sort_order,
  is_active      = EXCLUDED.is_active,
  updated_at     = now();

-- 4. Cursos Públicos (podem ser comprados individualmente ou acessados via qualquer plano)
INSERT INTO public.courses (
  title, slug, description, is_vip, price, published, certificate_enabled,
  level, access_type, access_days, requirements, what_you_learn, tags, max_students
) VALUES
(
  'Ultrassom Micro e Macrofocado',
  'ultrassom-micro-macrofocado',
  'Domine as técnicas de ultrassom micro e macrofocado para tratamentos estéticos faciais e corporais de alta precisão. Aprenda os fundamentos físicos, protocolos clínicos e como obter resultados seguros e eficazes.',
  false,
  99700,  -- R$ 997,00 em centavos / 100
  true, true, 'intermediate', 'lifetime', null,
  ARRAY['Conhecimento básico em estética','Registro profissional ativo'],
  ARRAY['Princípios físicos do ultrassom focalizado','Protocolos faciais e corporais','Segurança e contraindicações','Cases clínicos práticos'],
  ARRAY['ultrassom','estética','facial','corporal'],
  9999
),
(
  'Fotodepilação a Laser',
  'fotodepilacao-laser',
  'Treinamento completo em fotodepilação a laser: seleção de equipamentos, tipos de pele (escala Fitzpatrick), parâmetros de fluência, protocolos por região anatômica e gestão de intercorrências.',
  false,
  129700, -- R$ 1.297,00
  true, true, 'intermediate', 'lifetime', null,
  ARRAY['Conhecimento básico em estética ou medicina'],
  ARRAY['Tipos de laser e luz pulsada','Fototipo de pele e seleção de parâmetros','Protocolos por região anatômica','Manejo de complicações'],
  ARRAY['laser','depilação','fotodepilação','estética'],
  9999
),
(
  'Ozonioterapia no Tratamento das Disfunções Estéticas',
  'ozonioterapia-disfuncoes-esteticas',
  'Descubra o potencial terapêutico do ozônio no tratamento de celulite, gordura localizada, flacidez e cicatrizes. Aprenda as vias de aplicação, concentrações seguras e protocolos baseados em evidências.',
  false,
  79700,  -- R$ 797,00
  true, true, 'beginner', 'lifetime', null,
  ARRAY['Graduação em área de saúde ou estética'],
  ARRAY['Bioquímica do ozônio','Vias de aplicação: autohemoterapia, intramuscular, subcutânea','Protocolos para celulite e gordura localizada','Indicações e contraindicações'],
  ARRAY['ozonioterapia','ozônio','estética','disfunções'],
  9999
),
(
  'Imersão em Radiofrequência',
  'imersao-radiofrequencia',
  'Imersão completa em radiofrequência: monopolar, bipolar e multipolar. Entenda o mecanismo de ação no colágeno, protocolos de rejuvenescimento e remodelação corporal, e como maximizar resultados.',
  false,
  89700,  -- R$ 897,00
  true, true, 'intermediate', 'lifetime', null,
  ARRAY['Conhecimento prévio em estética'],
  ARRAY['Tipos de radiofrequência e modos de operação','Mecanismo de ação no tecido conjuntivo','Protocolos faciais e corporais','Combinação com outros recursos'],
  ARRAY['radiofrequência','RF','colágeno','remodelação'],
  9999
),
(
  'Jato de Plasma',
  'jato-de-plasma',
  'Aprenda a técnica de jato de plasma para lifting sem cirurgia, remoção de lesões benignas e rejuvenescimento periocular. Protocolo completo com teoria, prática e cuidados pós-procedimento.',
  false,
  109700, -- R$ 1.097,00
  true, true, 'advanced', 'lifetime', null,
  ARRAY['Graduação em estética, medicina ou enfermagem','Experiência prévia em procedimentos estéticos'],
  ARRAY['Física do plasma e ionização','Indicações: blefaroplastia não-cirúrgica, manchas, verrugas','Anestesia e conforto do paciente','Cuidados pós-procedimento'],
  ARRAY['plasma','lifting','blefaroplastia','rejuvenescimento'],
  9999
),
(
  'Eletrocarbolipólise',
  'eletrocarbiolise',
  'Técnica que combina eletroterapia e gás carbônico para tratamento de gordura localizada e celulite. Aprenda os fundamentos, parâmetros de equipamento e protocolos de aplicação para resultados expressivos.',
  false,
  69700,  -- R$ 697,00
  true, true, 'intermediate', 'lifetime', null,
  ARRAY['Formação em estética ou fisioterapia'],
  ARRAY['Mecanismo de ação: CO₂ e corrente elétrica','Parâmetros de frequência e intensidade','Protocolos para celulite e adiposidade','Associação com drenagem linfática'],
  ARRAY['eletrocarbolipólise','CO2','lipólise','celulite'],
  9999
)
ON CONFLICT (slug) DO UPDATE SET
  title               = EXCLUDED.title,
  description         = EXCLUDED.description,
  is_vip              = EXCLUDED.is_vip,
  price               = EXCLUDED.price,
  published           = EXCLUDED.published,
  certificate_enabled = EXCLUDED.certificate_enabled,
  level               = EXCLUDED.level,
  what_you_learn      = EXCLUDED.what_you_learn,
  tags                = EXCLUDED.tags;

-- 5. Cursos Exclusivos para Mentorados VIP (is_vip = true, sem preço individual)
INSERT INTO public.courses (
  title, slug, description, is_vip, price, published, certificate_enabled,
  level, access_type, access_days, requirements, what_you_learn, tags, max_students
) VALUES
(
  'Workshop: Complicações Pós-Endolaser',
  'workshop-complicacoes-pos-endolaser',
  'Workshop exclusivo para mentorados. Abordagem completa sobre prevenção, identificação precoce e manejo das principais complicações após procedimentos com endolaser. Conteúdo baseado em casos clínicos reais.',
  true,
  null,  -- Não comercializado individualmente
  true, true, 'advanced', 'lifetime', null,
  ARRAY['Ser mentorado ativo da plataforma','Experiência prévia com laser'],
  ARRAY['Identificação precoce de complicações','Manejo de hiperpigmentação e queimaduras','Protocolos de recuperação','Documentação e comunicação com o paciente'],
  ARRAY['endolaser','complicações','workshop','vip'],
  9999
),
(
  'Corrente Russa na Tonificação Muscular',
  'corrente-russa-tonificacao-muscular',
  'Conteúdo VIP para mentorados. Protocolo avançado de corrente russa para tonificação e hipertrofia muscular estética. Aplicações corporais, parâmetros ótimos e combinação com outros recursos.',
  true,
  null,
  true, true, 'intermediate', 'lifetime', null,
  ARRAY['Ser mentorado ativo da plataforma'],
  ARRAY['Princípios da eletroestimulação neuromuscular','Parâmetros de frequência e intensidade para hipertrofia','Protocolos por grupo muscular','Combinação com radiofrequência e ultrassom'],
  ARRAY['corrente russa','eletroestimulação','tonificação','vip'],
  9999
),
(
  'Criolipólise de Placas',
  'criolipólise-de-placas',
  'Conteúdo exclusivo para mentorados. Técnica de criolipólise com placas para redução de gordura localizada sem cirurgia. Seleção de pacientes, parâmetros de temperatura e protocolos de aplicação.',
  true,
  null,
  true, true, 'intermediate', 'lifetime', null,
  ARRAY['Ser mentorado ativo da plataforma'],
  ARRAY['Mecanismo de apoptose por frio','Critérios de seleção de pacientes','Posicionamento e tempo de aplicação','Combinação com drenagem linfática pós-procedimento'],
  ARRAY['criolipólise','placas','gordura','vip'],
  9999
)
ON CONFLICT (slug) DO UPDATE SET
  title               = EXCLUDED.title,
  description         = EXCLUDED.description,
  is_vip              = EXCLUDED.is_vip,
  price               = EXCLUDED.price,
  published           = EXCLUDED.published,
  certificate_enabled = EXCLUDED.certificate_enabled,
  level               = EXCLUDED.level,
  what_you_learn      = EXCLUDED.what_you_learn,
  tags                = EXCLUDED.tags;
