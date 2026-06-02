-- =============================================================================
-- Migration: 20260526134635_create_booking_requests
-- Purpose  : Anonymous lead capture table (villa mini-form → WhatsApp + DB)
-- NOTE     : Table `bookings` is NOT touched by this migration.
-- =============================================================================

-- =============================================================================
-- 1) TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.booking_requests (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   UUID        NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  host_id       UUID        NOT NULL REFERENCES auth.users(id),
  guest_name    TEXT        NOT NULL CHECK (length(trim(guest_name)) > 0),
  guest_phone   TEXT        NOT NULL CHECK (length(trim(guest_phone)) > 0),
  check_in      DATE        NOT NULL,
  check_out     DATE        NOT NULL,
  total_guests  INT         NOT NULL DEFAULT 1 CHECK (total_guests >= 1),
  message       TEXT,
  status        TEXT        NOT NULL DEFAULT 'Request'
                              CHECK (status IN ('Request','OnProcess','Confirmed','Checkout','Cancel')),
  admin_comment TEXT,
  host_reply    TEXT
                  CHECK (host_reply IS NULL OR host_reply IN ('done','reject','contact_me')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_out_after_check_in CHECK (check_out > check_in)
);

-- =============================================================================
-- 2) INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_booking_requests_host_created
  ON public.booking_requests(host_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_booking_requests_status
  ON public.booking_requests(status);

CREATE INDEX IF NOT EXISTS idx_booking_requests_property
  ON public.booking_requests(property_id);

CREATE INDEX IF NOT EXISTS idx_booking_requests_created
  ON public.booking_requests(created_at DESC);

-- =============================================================================
-- 3) TRIGGER: auto-update updated_at on every UPDATE
-- =============================================================================
CREATE OR REPLACE FUNCTION public.set_booking_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_booking_requests_updated_at ON public.booking_requests;
CREATE TRIGGER trg_booking_requests_updated_at
  BEFORE UPDATE ON public.booking_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_booking_requests_updated_at();

-- =============================================================================
-- 4) TRIGGER: auto-set host_id from properties.owner_id on INSERT
--    (safety net in case Server Action omits host_id)
--    SECURITY DEFINER so the function can read properties regardless of RLS.
--    NOTE: properties.owner_id references public.profiles(id), which itself
--    shadows auth.users.id (1-to-1 by design). host_id FK is on auth.users.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.set_booking_request_host_id()
RETURNS TRIGGER AS $$
DECLARE
  v_owner UUID;
BEGIN
  SELECT owner_id INTO v_owner
  FROM public.properties
  WHERE id = NEW.property_id;

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Property % has no owner', NEW.property_id;
  END IF;

  -- Always overwrite host_id with the real owner — guards against spoofing
  NEW.host_id := v_owner;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_booking_requests_set_host_id ON public.booking_requests;
CREATE TRIGGER trg_booking_requests_set_host_id
  BEFORE INSERT ON public.booking_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_booking_request_host_id();

-- =============================================================================
-- 5) ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;

-- SELECT: host sees their own rows; admin sees all rows
CREATE POLICY "booking_requests_select_host_or_admin"
  ON public.booking_requests FOR SELECT
  USING (
    host_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- INSERT: intentionally NO policy.
--   Inserts come exclusively from Server Actions using the service_role key,
--   which bypasses RLS entirely. Anon/authenticated clients cannot insert.

-- UPDATE: host may update their own rows (column whitelist enforced in Server Action)
CREATE POLICY "booking_requests_update_host_own"
  ON public.booking_requests FOR UPDATE
  USING (host_id = auth.uid())
  WITH CHECK (host_id = auth.uid());

-- UPDATE: admin may update any row (column whitelist enforced in Server Action)
CREATE POLICY "booking_requests_update_admin"
  ON public.booking_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- DELETE: admin only
CREATE POLICY "booking_requests_delete_admin"
  ON public.booking_requests FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
