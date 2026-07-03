-- Story 23.1: Certificate template builder and assets

CREATE TABLE IF NOT EXISTS public.certificate_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Modelo padrão',
  is_default boolean NOT NULL DEFAULT false,
  title text NOT NULL DEFAULT 'Certificado de Conclusão',
  body_template text NOT NULL DEFAULT 'Certificamos que {{student_name}} concluiu com aproveitamento o curso {{course_name}}.',
  issuer_name text NOT NULL DEFAULT 'Fábio Borges',
  issuer_role text NOT NULL DEFAULT 'Mentor · Fábio Borges Mentoria',
  signature_url text,
  logo_url text,
  background_url text,
  primary_color text NOT NULL DEFAULT '#48a1fe',
  layout_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS certificate_templates_single_default
  ON public.certificate_templates (is_default)
  WHERE is_default = true;

ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "certificate_templates_select_admin"
  ON public.certificate_templates FOR SELECT
  USING (is_admin());

CREATE POLICY "certificate_templates_write_admin"
  ON public.certificate_templates FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE OR REPLACE FUNCTION public.set_certificate_template_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_certificate_template_updated_at ON public.certificate_templates;
CREATE TRIGGER set_certificate_template_updated_at
  BEFORE UPDATE ON public.certificate_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.set_certificate_template_updated_at();

INSERT INTO storage.buckets (id, name, public)
VALUES ('certificate-assets', 'certificate-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admin reads certificate assets"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'certificate-assets'
    AND public.is_admin()
  );

CREATE POLICY "Admin uploads certificate assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'certificate-assets'
    AND public.is_admin()
  );

CREATE POLICY "Admin updates certificate assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'certificate-assets'
    AND public.is_admin()
  )
  WITH CHECK (
    bucket_id = 'certificate-assets'
    AND public.is_admin()
  );

CREATE POLICY "Admin deletes certificate assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'certificate-assets'
    AND public.is_admin()
  );
