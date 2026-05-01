-- Migration: Add last_reminder_sent_at column to bookings table
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS last_reminder_sent_at timestamptz;
