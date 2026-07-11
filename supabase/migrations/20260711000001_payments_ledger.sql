-- Migration: Ledger de Pagamentos (Story 24.1)
-- Fonte única da verdade do faturamento. Cada pagamento confirmado = 1 linha,
-- reconciliável 1:1 contra a PagarMe via provider_order_id.

CREATE TABLE IF NOT EXISTS public.payments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES public.users(id) ON DELETE SET NULL,
  kind              text NOT NULL CHECK (kind IN ('course', 'cart', 'plan')),
  item_ref          text,                        -- courseId | planId | JSON de courseIds
  amount_cents      integer NOT NULL DEFAULT 0,  -- valor REAL pago (centavos)
  method            text CHECK (method IN ('credit_card', 'pix', 'boleto')),
  provider          text NOT NULL DEFAULT 'pagarme',
  provider_order_id text NOT NULL,
  status            text NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'refunded', 'chargeback')),
  metadata          jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at        timestamptz NOT NULL DEFAULT now(),
  -- Idempotência: um pedido da PagarMe gera no máximo uma linha
  UNIQUE (provider, provider_order_id)
);

CREATE INDEX IF NOT EXISTS payments_created_at_idx ON public.payments (created_at);
CREATE INDEX IF NOT EXISTS payments_user_id_idx    ON public.payments (user_id);
CREATE INDEX IF NOT EXISTS payments_status_idx     ON public.payments (status);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Leitura apenas para admin (relatórios/dashboard rodam com a sessão do admin).
-- Escrita é feita exclusivamente pela service_role (webhook), que bypassa RLS.
CREATE POLICY "payments_select_admin" ON public.payments
  FOR SELECT USING (is_admin());
