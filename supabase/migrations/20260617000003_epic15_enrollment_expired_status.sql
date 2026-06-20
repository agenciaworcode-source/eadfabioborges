-- Epic 15 - Story 15.3: Enrollment expired status
ALTER TYPE public.enrollment_status ADD VALUE IF NOT EXISTS 'expired';
