-- Fix plan prices to match planosinfos.md
-- price_monthly = parcela mensal (12x no cartão)
-- price_annual  = valor à vista com 17% de desconto
--
-- Prata:        12x R$125    = R$1.500/ano | à vista R$1.245 (-17%)
-- Ouro:         12x R$300    = R$3.600/ano | à vista R$2.988 (-17%)
-- Diamante:     12x R$400    = R$4.800/ano | à vista R$3.984 (-17%)
-- Macroempresa: 12x R$10.000 = R$120.000/ano | à vista R$99.600 (-17%)

INSERT INTO public.plans (id, name, price_monthly, price_annual, sort_order, is_active)
VALUES
  ('prata',        'Prata',          12500,    124500,  1, true),
  ('ouro',         'Ouro',           30000,    298800,  2, true),
  ('diamante',     'Diamante',       40000,    398400,  3, true),
  ('macroempresa', 'Macroempresa', 1000000,  9960000,  4, true)
ON CONFLICT (id) DO UPDATE SET
  name          = EXCLUDED.name,
  price_monthly = EXCLUDED.price_monthly,
  price_annual  = EXCLUDED.price_annual,
  sort_order    = EXCLUDED.sort_order,
  is_active     = EXCLUDED.is_active,
  updated_at    = now();
