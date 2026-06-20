-- Migration 8: plans table (preços gerenciados via admin UI)

CREATE TABLE public.plans (
  id             text PRIMARY KEY,
  name           text NOT NULL,
  price_monthly  integer NOT NULL DEFAULT 0,  -- BRL centavos (ex: 9700 = R$ 97,00)
  price_annual   integer NOT NULL DEFAULT 0,
  sort_order     integer NOT NULL DEFAULT 0,
  is_active      boolean NOT NULL DEFAULT true,
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Seed com preços iniciais
INSERT INTO public.plans (id, name, price_monthly, price_annual, sort_order) VALUES
  ('free',         'Free',         0,      0,       0),
  ('prata',        'Prata',        9700,   97000,   1),
  ('ouro',         'Ouro',         19700,  197000,  2),
  ('diamante',     'Diamante',     39700,  397000,  3),
  ('macroempresa', 'Macroempresa', 0,      0,       4);

-- RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read on plans"
  ON public.plans FOR SELECT
  USING (true);

CREATE POLICY "Admin write on plans"
  ON public.plans FOR ALL
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );
