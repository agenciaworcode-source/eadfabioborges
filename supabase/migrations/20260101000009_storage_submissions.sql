-- Migration 9: Supabase Storage bucket for student assignment submissions

INSERT INTO storage.buckets (id, name, public)
VALUES ('submissions', 'submissions', false)
ON CONFLICT (id) DO NOTHING;

-- Owner pode ler seus próprios arquivos
CREATE POLICY "User reads own submissions"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'submissions'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Aluno faz upload na própria pasta (path: {userId}/{submissionId}/{filename})
CREATE POLICY "User uploads own submissions"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'submissions'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Admin lê todos os arquivos de submissão
CREATE POLICY "Admin reads all submissions"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'submissions'
    AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- Admin pode deletar submissões
CREATE POLICY "Admin deletes submissions"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'submissions'
    AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );
