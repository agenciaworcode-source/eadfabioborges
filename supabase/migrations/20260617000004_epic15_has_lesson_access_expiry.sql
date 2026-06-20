-- Epic 15 - Story 15.3: has_lesson_access with enrollment expiry
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

CREATE OR REPLACE FUNCTION public.has_lesson_access(p_lesson_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.lessons l
    JOIN public.modules m ON m.id = l.module_id
    JOIN public.enrollments e ON e.course_id = m.course_id
    WHERE l.id = p_lesson_id
      AND e.user_id = auth.uid()
      AND e.status = 'active'
      AND (e.expires_at IS NULL OR e.expires_at > now())
  )
  OR EXISTS (
    SELECT 1
    FROM public.lessons l
    JOIN public.modules m ON m.id = l.module_id
    JOIN public.courses c ON c.id = m.course_id
    JOIN public.subscriptions s ON s.user_id = auth.uid()
    WHERE l.id = p_lesson_id
      AND c.is_vip = true
      AND s.status = 'active'
      AND s.period_end > now()
  )
  OR EXISTS (
    SELECT 1
    FROM public.lessons l
    JOIN public.modules m ON m.id = l.module_id
    WHERE l.id = p_lesson_id
      AND m.is_free_preview = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
