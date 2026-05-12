-- Migration for Calendar Synchronization tables
CREATE TABLE public.calendar_feeds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    source_name TEXT NOT NULL,
    ical_url TEXT NOT NULL,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.blocked_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    source TEXT NOT NULL, -- 'airbnb', 'booking', 'funduq', 'manual'
    external_uid TEXT,
    summary TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Unique index to prevent duplicate blocks from the same external event
CREATE UNIQUE INDEX blocked_dates_property_uid_idx ON public.blocked_dates(property_id, external_uid) WHERE external_uid IS NOT NULL;

-- Enable RLS
ALTER TABLE public.calendar_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;

-- Policies for calendar_feeds
CREATE POLICY "Users can view their own calendar feeds"
    ON public.calendar_feeds FOR SELECT
    USING (property_id IN (SELECT id FROM public.properties WHERE owner_id = auth.uid()));

CREATE POLICY "Users can insert their own calendar feeds"
    ON public.calendar_feeds FOR INSERT
    WITH CHECK (property_id IN (SELECT id FROM public.properties WHERE owner_id = auth.uid()));

CREATE POLICY "Users can update their own calendar feeds"
    ON public.calendar_feeds FOR UPDATE
    USING (property_id IN (SELECT id FROM public.properties WHERE owner_id = auth.uid()));

CREATE POLICY "Users can delete their own calendar feeds"
    ON public.calendar_feeds FOR DELETE
    USING (property_id IN (SELECT id FROM public.properties WHERE owner_id = auth.uid()));

-- Policies for blocked_dates
CREATE POLICY "Users can view their own blocked dates"
    ON public.blocked_dates FOR SELECT
    USING (property_id IN (SELECT id FROM public.properties WHERE owner_id = auth.uid()));

-- Also allow public access to blocked dates for booking availability
CREATE POLICY "Public can view blocked dates"
    ON public.blocked_dates FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own blocked dates"
    ON public.blocked_dates FOR INSERT
    WITH CHECK (property_id IN (SELECT id FROM public.properties WHERE owner_id = auth.uid()));

CREATE POLICY "Users can update their own blocked dates"
    ON public.blocked_dates FOR UPDATE
    USING (property_id IN (SELECT id FROM public.properties WHERE owner_id = auth.uid()));

CREATE POLICY "Users can delete their own blocked dates"
    ON public.blocked_dates FOR DELETE
    USING (property_id IN (SELECT id FROM public.properties WHERE owner_id = auth.uid()));

-- Service role bypasses RLS naturally, which is what we need for Cron jobs
