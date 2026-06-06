-- =============================================================================
-- Migration: 20260607_add_guest_id_to_booking_requests
-- Purpose  : Allow authenticated guests to see their own booking requests
--            in the "My Bookings" page.
-- =============================================================================

-- 1) Add nullable guest_id column
ALTER TABLE public.booking_requests
  ADD COLUMN IF NOT EXISTS guest_id UUID REFERENCES auth.users(id);

-- 2) Index for fast lookups by guest
CREATE INDEX IF NOT EXISTS idx_booking_requests_guest_id
  ON public.booking_requests(guest_id)
  WHERE guest_id IS NOT NULL;

-- 3) RLS policy: guest can SELECT their own rows
CREATE POLICY "booking_requests_select_own_guest"
  ON public.booking_requests FOR SELECT
  USING (guest_id = auth.uid());
