-- ============================================================
-- Security fix S1 — Impedir escalação de privilégio via self-update
-- ============================================================
-- Contexto: a policy `users_update_own` (FOR UPDATE USING id = auth.uid())
-- não tinha WITH CHECK restringindo colunas. Como `role` aceita 'admin' no
-- CHECK, um usuário comum conseguia se auto-promover a admin com um simples
-- PATCH via anon key (confirmado por teste em 2026-07-03).
--
-- Solução: trigger BEFORE UPDATE que "pina" as colunas privilegiadas (role e
-- plan) ao valor anterior quando o autor da mudança NÃO é service_role nem
-- admin. RLS a nível de coluna é limitado no Postgres; o trigger é robusto e
-- não quebra o fluxo de edição de perfil (que pode enviar a linha inteira).
--
-- service_role (rotas admin server-side, webhooks de pagamento) e admins
-- autenticados continuam podendo alterar role/plan normalmente.
-- ============================================================

CREATE OR REPLACE FUNCTION public.prevent_privileged_self_update()
RETURNS trigger AS $$
BEGIN
  -- service_role bypassa (usado por rotas admin server-side e webhooks)
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Admins autenticados podem alterar role/plan
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- Usuário comum: não pode alterar role nem plan — restaura valores antigos
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    NEW.role := OLD.role;
  END IF;

  IF NEW.plan IS DISTINCT FROM OLD.plan THEN
    NEW.plan := OLD.plan;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_privileged_self_update ON public.users;

CREATE TRIGGER trg_prevent_privileged_self_update
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_privileged_self_update();
