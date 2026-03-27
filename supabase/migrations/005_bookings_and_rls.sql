-- ═══════════════════════════════════════════════════════════════
-- Phase 5: Bookings table + iCal sync support + RLS policies
-- ═══════════════════════════════════════════════════════════════

-- 1. Bookings Table
CREATE TABLE IF NOT EXISTS public.bookings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  guest_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_in      date NOT NULL,
  check_out     date NOT NULL,
  total_guests  int  NOT NULL DEFAULT 1,
  status        text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'confirmed', 'declined', 'cancelled')),
  message       text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  -- Prevent identical date overlaps at DB level
  CONSTRAINT check_dates CHECK (check_out > check_in)
);

-- Index for fast availability lookups
CREATE INDEX IF NOT EXISTS idx_bookings_property_dates
  ON public.bookings (property_id, check_in, check_out)
  WHERE status IN ('pending', 'confirmed');

-- 2. iCal Sync Links (hosts can attach external calendar links)
CREATE TABLE IF NOT EXISTS public.ical_links (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id  uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  url          text NOT NULL,
  label        text,               -- e.g. "Airbnb Calendar", "Booking.com"
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- 3. Add owner contact fields to profiles (for contact reveal)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS whatsapp text;

-- ═══════════════════════════════════════════════════════════════
-- RLS Policies for bookings
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Guests can read their own bookings
CREATE POLICY "Guests can view own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = guest_id);

-- Guests can create bookings (insert)
CREATE POLICY "Guests can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = guest_id);

-- Property owners can read bookings for their properties
CREATE POLICY "Owners can view bookings for their properties"
  ON public.bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = bookings.property_id
        AND properties.owner_id = auth.uid()
    )
  );

-- Property owners can update bookings for their properties (approve/decline)
CREATE POLICY "Owners can update bookings for their properties"
  ON public.bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = bookings.property_id
        AND properties.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = bookings.property_id
        AND properties.owner_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- RLS Policies for ical_links
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.ical_links ENABLE ROW LEVEL SECURITY;

-- Only property owners can manage their ical links
CREATE POLICY "Owners can manage ical links"
  ON public.ical_links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = ical_links.property_id
        AND properties.owner_id = auth.uid()
    )
  );

-- Anyone can read ical links (needed by server actions for sync)
CREATE POLICY "Public read ical links"
  ON public.ical_links FOR SELECT
  USING (true);
