-- Coupon system tables
CREATE TABLE IF NOT EXISTS public.coupons (
  id           uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code         text        NOT NULL,
  description  text        NOT NULL DEFAULT '',
  type         text        NOT NULL CHECK (type IN ('percentage','fixed')),
  value        numeric     NOT NULL CHECK (value > 0),
  max_uses     integer,                    -- NULL = ilimitado
  uses_count   integer     NOT NULL DEFAULT 0,
  valid_from   timestamptz,
  valid_until  timestamptz,
  applies_to   text        NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all','plans','courses')),
  plan_ids     text[]      NOT NULL DEFAULT '{}',
  course_ids   uuid[]      NOT NULL DEFAULT '{}',
  is_active    boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT coupons_code_unique UNIQUE (code)
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Apenas admins gerenciam cupons
CREATE POLICY "admins manage coupons" ON public.coupons
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Tabela de usos (para evitar reuso por mesmo usuario na mesma compra e rastrear historico)
CREATE TABLE IF NOT EXISTS public.coupon_uses (
  id             uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id      uuid        NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id        uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  order_type     text        NOT NULL CHECK (order_type IN ('plan','course','cart')),
  order_ref      text,
  discount_cents integer     NOT NULL,
  used_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coupon_uses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see own coupon uses" ON public.coupon_uses
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "admins manage coupon_uses" ON public.coupon_uses
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "service can insert coupon_uses" ON public.coupon_uses
  FOR INSERT WITH CHECK (true);
