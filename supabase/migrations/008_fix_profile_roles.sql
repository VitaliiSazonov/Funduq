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
