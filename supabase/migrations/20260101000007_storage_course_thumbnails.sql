-- Migration 7: Supabase Storage bucket for course thumbnails

INSERT INTO storage.buckets (id, name, public)
VALUES ('course-thumbnails', 'course-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read (public bucket)
CREATE POLICY "Public read on course-thumbnails"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'course-thumbnails');

-- Allow admin to upload new thumbnails
CREATE POLICY "Admin upload on course-thumbnails"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'course-thumbnails'
    AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- Allow admin to overwrite (upsert) existing thumbnails
CREATE POLICY "Admin update on course-thumbnails"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'course-thumbnails'
    AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );
