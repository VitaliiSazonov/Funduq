-- ═══════════════════════════════════════════════════════════════
-- Phase 6: Admin Moderation — pending_review, suspend, admin RLS
-- ═══════════════════════════════════════════════════════════════

-- 1. Helper: is_admin() — checks caller's profile role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. Expand allowed status values for properties
--    Current CHECK: status IN ('active', 'inactive', 'archived')
--    New CHECK: adds 'pending_review' and 'suspended'
ALTER TABLE public.properties
  DROP CONSTRAINT IF EXISTS properties_status_check;

ALTER TABLE public.properties
  ADD CONSTRAINT properties_status_check
  CHECK (status IN ('active', 'inactive', 'archived', 'pending_review', 'suspended'));

-- 3. Change default status so new submissions go to moderation queue
ALTER TABLE public.properties
  ALTER COLUMN status SET DEFAULT 'pending_review';

-- ═══════════════════════════════════════════════════════════════
-- Admin RLS policies
-- ═══════════════════════════════════════════════════════════════

-- Admin can read ALL properties (including pending / suspended)
CREATE POLICY "Admin can read all properties"
  ON public.properties FOR SELECT
  USING (public.is_admin());

-- Admin can update any property (status changes, etc.)
CREATE POLICY "Admin can update any property"
  ON public.properties FOR UPDATE
  USING (public.is_admin());

-- Admin can read ALL profiles
CREATE POLICY "Admin can read all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- Admin can read ALL bookings
CREATE POLICY "Admin can read all bookings"
  ON public.bookings FOR SELECT
  USING (public.is_admin());

-- ═══════════════════════════════════════════════════════════════
-- Also allow owners to see their own pending/suspended properties
-- The existing "Guests can view active properties" only shows active.
-- Owners need to see ALL their own properties regardless of status.
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "Owners can view own properties"
  ON public.properties FOR SELECT
  USING (auth.uid() = owner_id);
