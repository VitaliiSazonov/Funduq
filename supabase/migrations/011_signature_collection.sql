-- Migration: Add is_signature flag to properties for Signature Collections
-- Properties marked as signature will appear in the scroll-driven showcase on the homepage.
-- Only admins can toggle this flag.

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS is_signature BOOLEAN DEFAULT FALSE;

-- Index for efficient querying of signature properties
CREATE INDEX IF NOT EXISTS idx_properties_signature ON public.properties (is_signature) WHERE is_signature = TRUE;

-- Comment for documentation
COMMENT ON COLUMN public.properties.is_signature IS 'Marks a property for the Signature Collections showcase on the homepage. Toggled by admin.';
