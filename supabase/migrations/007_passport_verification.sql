-- ═══════════════════════════════════════════════════════════════
-- 007 — Passport Verification
-- Adds passport upload & verification tracking to profiles,
-- creates a private storage bucket, and configures RLS.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Add fields to profiles ──────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS passport_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS passport_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS passport_submitted_at TIMESTAMPTZ;

-- ── 2. Create private bucket (idempotent) ──────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('passport-documents', 'passport-documents', false)
ON CONFLICT (id) DO NOTHING;

-- ── 3. Storage RLS: users upload to their own folder ───────────
CREATE POLICY "Users can upload own passport"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'passport-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ── 4. Storage RLS: only admin reads passport documents ────────
CREATE POLICY "Only admin can read passports"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'passport-documents' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ── 5. Profiles RLS: users can read own verification status ────
-- (This may already exist; wrap in DO block for safety)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Users can read own passport status'
  ) THEN
    CREATE POLICY "Users can read own passport status"
    ON profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid());
  END IF;
END $$;
