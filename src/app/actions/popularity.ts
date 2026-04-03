"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface PopularProperty {
  id: string;
  title: string;
  location: string;
  imageUrl: string;
  priceMin: number;
  priceMax: number;
  popularityScore: number;
  wishlistCount: number;
  bookingCount: number;
  type: string;
  bedrooms: number;
}

// ─────────────────────────────────────────────────────────────
// Track a property view (with deduplication)
// ─────────────────────────────────────────────────────────────

export async function trackPropertyView(
  propertyId: string,
  sessionHash?: string
): Promise<void> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Deduplication: check if this user/session already viewed today
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    if (user) {
      // Authenticated user — deduplicate by user_id + date
      const { data: existing } = await supabase
        .from("property_views")
        .select("id")
        .eq("property_id", propertyId)
        .eq("viewer_id", user.id)
        .gte("viewed_at", `${today}T00:00:00Z`)
        .lte("viewed_at", `${today}T23:59:59Z`)
        .maybeSingle();

      if (existing) return; // Already counted today

      await supabase.from("property_views").insert({
        property_id: propertyId,
        viewer_id: user.id,
        session_hash: sessionHash || null,
      });
    } else if (sessionHash) {
      // Anonymous visitor — deduplicate by session_hash + date
      // Use admin client since anonymous users may not have insert permissions through RLS
      const admin = createAdminClient();

      const { data: existing } = await admin
        .from("property_views")
        .select("id")
        .eq("property_id", propertyId)
        .eq("session_hash", sessionHash)
        .gte("viewed_at", `${today}T00:00:00Z`)
        .lte("viewed_at", `${today}T23:59:59Z`)
        .maybeSingle();

      if (existing) return;

      await admin.from("property_views").insert({
        property_id: propertyId,
        viewer_id: null,
        session_hash: sessionHash,
      });
    }
  } catch {
    // Silently fail — view tracking should never break the user experience
  }
}

// ─────────────────────────────────────────────────────────────
// Get Popular Properties (ranked by popularity_score)
// ─────────────────────────────────────────────────────────────

export async function getPopularProperties(
  limit: number = 8
): Promise<PopularProperty[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("properties")
      .select("id, title, location_district, location_emirate, main_image_url, price_min, price_max, popularity_score, type, bedrooms")
      .eq("status", "active")
      .order("popularity_score", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching popular properties:", error);
      return [];
    }

    if (!data || data.length === 0) return [];

    // Fetch wishlist and booking counts using admin client (bypasses RLS for aggregation)
    const admin = createAdminClient();
    const propertyIds = data.map((p) => p.id);

    // Wishlist counts
    let wishlistCounts: Record<string, number> = {};
    try {
      const { data: wishlistData } = await admin
        .from("wishlists")
        .select("property_id")
        .in("property_id", propertyIds);

      (wishlistData || []).forEach((w) => {
        wishlistCounts[w.property_id] = (wishlistCounts[w.property_id] || 0) + 1;
      });
    } catch {
      // Wishlists table may not have data yet
    }

    // Confirmed booking counts
    let bookingCounts: Record<string, number> = {};
    try {
      const { data: bookingData } = await admin
        .from("bookings")
        .select("property_id")
        .in("property_id", propertyIds)
        .eq("status", "confirmed");

      (bookingData || []).forEach((b) => {
        bookingCounts[b.property_id] = (bookingCounts[b.property_id] || 0) + 1;
      });
    } catch {
      // Bookings may be empty
    }

    return data.map((row) => ({
      id: row.id,
      title: row.title,
      location: `${row.location_district}, ${row.location_emirate}`,
      imageUrl: row.main_image_url || "/images/props/placeholder.png",
      priceMin: row.price_min,
      priceMax: row.price_max,
      popularityScore: row.popularity_score || 0,
      wishlistCount: wishlistCounts[row.id] || 0,
      bookingCount: bookingCounts[row.id] || 0,
      type: row.type || "Villa",
      bedrooms: row.bedrooms,
    }));
  } catch (e) {
    console.error("Error in getPopularProperties:", e);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────
// Recalculate popularity scores for all active properties
// Called periodically or after significant events
// ─────────────────────────────────────────────────────────────

export async function recalculatePopularityScores(): Promise<{
  success: boolean;
  error?: string;
}> {
  const admin = createAdminClient();

  const { error } = await admin.rpc("recalculate_popularity_scores");

  if (error) {
    console.error("Error recalculating popularity scores:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
