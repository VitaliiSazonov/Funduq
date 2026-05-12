-- ═══════════════════════════════════════════════════════════════
-- Migration 016: Fix bookings table for anonymous guest bookings
-- ═══════════════════════════════════════════════════════════════

-- 1. Add guest contact fields (for unauthenticated bookings)
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS guest_name  text,
  ADD COLUMN IF NOT EXISTS guest_email text,
  ADD COLUMN IF NOT EXISTS guest_phone text;

-- 2. Make guest_id optional (allow anonymous/unauthenticated bookings)
ALTER TABLE public.bookings
  ALTER COLUMN guest_id DROP NOT NULL;

-- 3. Drop the old "Guests can create bookings" policy that requires auth
DROP POLICY IF EXISTS "Guests can create bookings" ON public.bookings;

-- 4. Add new policy: anyone (including anonymous) can INSERT a booking
CREATE POLICY "Anyone can create booking request"
  ON public.bookings FOR INSERT
  WITH CHECK (true);

-- 5. Also allow anon to read their own booking by id (optional — for success confirmation)
-- Guests view own bookings by guest_id (authenticated guests only, existing policy remains)

-- 6. Ensure blocked_dates is insertable by service_role (needed for approveBooking)
-- The cron-job service_role bypasses RLS naturally.
-- But approveBooking uses the regular client (user-authenticated), so we need a policy
-- allowing property owners to insert blocked_dates.
DROP POLICY IF EXISTS "Owners can insert blocked dates" ON public.blocked_dates;
CREATE POLICY "Owners can insert blocked dates"
  ON public.blocked_dates FOR INSERT
  WITH CHECK (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  );
