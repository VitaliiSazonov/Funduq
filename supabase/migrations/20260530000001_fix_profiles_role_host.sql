-- Fix profiles.role CHECK constraint: remove 'owner', enforce guest/host/admin only.
-- Context: Migration 008 added 'host' but kept 'owner' in the CHECK.
-- Now we need to remove 'owner' entirely so only guest/host/admin are valid.
-- Generated: 2026-05-30
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('guest','host','admin'));
UPDATE public.profiles SET role='host' WHERE role='owner';
