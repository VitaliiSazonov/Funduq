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
