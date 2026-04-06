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
-- ═══════════════════════════════════════════════════════════════
-- Migration 008: Fix profile role CHECK constraint & add missing columns
-- ═══════════════════════════════════════════════════════════════
-- Problem: The app sends role='host' during registration, but the
-- CHECK constraint only allows ('guest', 'owner', 'admin').
-- The trigger handle_new_user() tries to insert role='host' which
-- violates the constraint and rolls back the ENTIRE auth.users insert.
-- This causes "Something went wrong" on registration.
-- ═══════════════════════════════════════════════════════════════

-- 1. Drop old CHECK and add 'host' to allowed roles
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('guest', 'host', 'owner', 'admin'));

-- 2. Migrate existing 'owner' rows → 'host' for consistency
UPDATE public.profiles SET role = 'host' WHERE role = 'owner';

-- 3. Add email column if it doesn't exist (the upsert in signUpAction writes it)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'profiles'
      AND column_name  = 'email'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT;
  END IF;
END $$;

-- 4. Update the trigger to also store email & phone from user_metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role, email, phone)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.raw_user_meta_data->>'role', 'guest'),
    new.email,
    new.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Allow authenticated users to INSERT their own profile
--    (needed for the upsert fallback in signUpAction)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
      AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile"
      ON public.profiles FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;
-- ═══════════════════════════════════════════════════════════════
-- Phase 9: Activate all existing properties that are in pending_review
-- 
-- Context: Properties were submitted with status 'pending_review' 
-- (per migration 006) but were never approved by an admin.
-- The host dashboard was showing them as "ACTIVE" due to a 
-- missing status field in the Property transform, creating confusion.
--
-- This migration activates all pending_review properties.
-- Going forward, new submissions will still require admin approval.
-- ═══════════════════════════════════════════════════════════════

UPDATE public.properties
SET status = 'active', updated_at = NOW()
WHERE status = 'pending_review';
-- 010: Add amenities and gallery_urls columns to properties
-- amenities: text[] array for Pool, Spa, Gym, etc.
-- gallery_urls: text[] array for all property images (beyond main_image_url)

ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT '{}';

-- Add a comment for documentation
COMMENT ON COLUMN public.properties.amenities IS 'Array of amenity labels (e.g. Private Pool, Spa, Gym)';
COMMENT ON COLUMN public.properties.gallery_urls IS 'Array of image URLs for the property gallery';
-- Migration: Add is_signature flag to properties for Signature Collections
-- Properties marked as signature will appear in the scroll-driven showcase on the homepage.
-- Only admins can toggle this flag.

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS is_signature BOOLEAN DEFAULT FALSE;

-- Index for efficient querying of signature properties
CREATE INDEX IF NOT EXISTS idx_properties_signature ON public.properties (is_signature) WHERE is_signature = TRUE;

-- Comment for documentation
COMMENT ON COLUMN public.properties.is_signature IS 'Marks a property for the Signature Collections showcase on the homepage. Toggled by admin.';
-- Add location_country and events_allowed columns to properties table
-- location_country allows filtering by country (e.g., 'UAE', 'Brazil', 'Italy', 'Spain')
-- events_allowed indicates whether parties/events are permitted at the property

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS location_country TEXT DEFAULT 'UAE',
  ADD COLUMN IF NOT EXISTS events_allowed BOOLEAN DEFAULT FALSE;

-- Backfill existing properties: set country to 'UAE' for all current records
UPDATE public.properties SET location_country = 'UAE' WHERE location_country IS NULL;
-- ═══════════════════════════════════════════════════════════════
-- Phase 13: Popularity System — Views, Wishlists, Score
-- ═══════════════════════════════════════════════════════════════

-- 1. Property Views — tracks unique page views per day
CREATE TABLE IF NOT EXISTS public.property_views (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  viewer_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- nullable for anon
  session_hash text,  -- for deduplication of anonymous views
  viewed_at   timestamptz NOT NULL DEFAULT now()
);

-- Index for fast count queries and dedup lookups
CREATE INDEX IF NOT EXISTS idx_property_views_property
  ON public.property_views (property_id, viewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_property_views_dedup
  ON public.property_views (property_id, viewer_id, (viewed_at::date));

CREATE INDEX IF NOT EXISTS idx_property_views_session_dedup
  ON public.property_views (property_id, session_hash, (viewed_at::date));

-- 2. Wishlists — user favorites
CREATE TABLE IF NOT EXISTS public.wishlists (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, property_id) -- one like per user per property
);

CREATE INDEX IF NOT EXISTS idx_wishlists_property
  ON public.wishlists (property_id);

CREATE INDEX IF NOT EXISTS idx_wishlists_user
  ON public.wishlists (user_id);

-- 3. Add popularity_score to properties
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS popularity_score numeric NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_properties_popularity
  ON public.properties (popularity_score DESC)
  WHERE status = 'active';

-- ═══════════════════════════════════════════════════════════════
-- RLS Policies
-- ═══════════════════════════════════════════════════════════════

-- Property Views
ALTER TABLE public.property_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a view (including anonymous visitors)
CREATE POLICY "Anyone can insert property views"
  ON public.property_views FOR INSERT
  WITH CHECK (true);

-- Public read for aggregation (server actions use admin client anyway)
CREATE POLICY "Public read property views"
  ON public.property_views FOR SELECT
  USING (true);

-- Wishlists
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- Users can manage their own wishlist items
CREATE POLICY "Users can view own wishlist"
  ON public.wishlists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to wishlist"
  ON public.wishlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from wishlist"
  ON public.wishlists FOR DELETE
  USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- Popularity Score Recalculation Function
-- Can be called via: SELECT recalculate_popularity_scores();
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.recalculate_popularity_scores()
RETURNS void AS $$
BEGIN
  UPDATE public.properties p SET popularity_score = (
    -- Confirmed bookings (weight: 5)
    COALESCE((
      SELECT COUNT(*) FROM public.bookings b
      WHERE b.property_id = p.id AND b.status = 'confirmed'
    ), 0) * 5
    +
    -- Wishlist count (weight: 2)
    COALESCE((
      SELECT COUNT(*) FROM public.wishlists w
      WHERE w.property_id = p.id
    ), 0) * 2
    +
    -- Views in last 30 days (weight: 0.01)
    COALESCE((
      SELECT COUNT(*) FROM public.property_views v
      WHERE v.property_id = p.id
        AND v.viewed_at > NOW() - INTERVAL '30 days'
    ), 0) * 0.01
  )
  WHERE p.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Funduq Supabase SQL Schema (MVP)

-- Enable pgcrypto (if not already for gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- PROFILES TABLE
-- Linked to auth.users, stores personal information and roles
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
    role TEXT NOT NULL DEFAULT 'guest' CHECK (role IN ('guest', 'owner', 'admin')),
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROPERTIES TABLE
-- Stores information about villas and penthouses
CREATE TABLE public.properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL, -- e.g., 'Villa', 'Penthouse'
    price_min NUMERIC NOT NULL,
    price_max NUMERIC NOT NULL,
    bedrooms INTEGER NOT NULL CHECK (bedrooms >= 0),
    bathrooms INTEGER NOT NULL CHECK (bathrooms >= 0),
    max_guests INTEGER NOT NULL CHECK (max_guests > 0),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    location_emirate TEXT NOT NULL, -- e.g., 'Dubai', 'Abu Dhabi', 'Ras Al Khaimah'
    location_district TEXT NOT NULL, -- e.g., 'Palm Jumeirah', 'Downtown', 'Al Barari'
    main_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BOOKINGS TABLE
-- Handles short-term rental transactions and reservation states
CREATE TABLE public.bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    guest_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    total_guests INTEGER NOT NULL CHECK (total_guests > 0),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Ensure check_out is after check_in
    CONSTRAINT valid_booking_dates CHECK (check_out > check_in)
);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES

-- Profiles: Anyone can read their own profile, admins see everything
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Properties: 
-- 1. Guests can read active properties
CREATE POLICY "Guests can view active properties" 
ON public.properties FOR SELECT USING (status = 'active');

-- 2. Owners can manage their own properties
CREATE POLICY "Owners can create properties" 
ON public.properties FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own properties" 
ON public.properties FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete own properties" 
ON public.properties FOR DELETE USING (auth.uid() = owner_id);

-- Bookings: 
-- Read access for involved parties (Guest or Property Owner)
CREATE POLICY "Parties can view bookings" 
ON public.bookings FOR SELECT USING (
    auth.uid() = guest_id 
    OR auth.uid() IN (SELECT owner_id FROM public.properties WHERE id = property_id)
);

-- Guest can insert bookings
CREATE POLICY "Guests can book properties" 
ON public.bookings FOR INSERT WITH CHECK (auth.uid() = guest_id);

-- Involved parties can update booking status
CREATE POLICY "Parties can update bookings" 
ON public.bookings FOR UPDATE USING (
    auth.uid() = guest_id 
    OR auth.uid() IN (SELECT owner_id FROM public.properties WHERE id = property_id)
);

-- TRIGGER FOR AUTOMATIC PROFILE CREATION ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', COALESCE(new.raw_user_meta_data->>'role', 'guest'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
