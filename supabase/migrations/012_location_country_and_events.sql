-- Add location_country and events_allowed columns to properties table
-- location_country allows filtering by country (e.g., 'UAE', 'Brazil', 'Italy', 'Spain')
-- events_allowed indicates whether parties/events are permitted at the property

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS location_country TEXT DEFAULT 'UAE',
  ADD COLUMN IF NOT EXISTS events_allowed BOOLEAN DEFAULT FALSE;

-- Backfill existing properties: set country to 'UAE' for all current records
UPDATE public.properties SET location_country = 'UAE' WHERE location_country IS NULL;
