"use server";

import { createClient } from "@/lib/supabase/server";

// ─────────────────────────────────────────────────────────────
// Toggle wishlist (add/remove)
// ─────────────────────────────────────────────────────────────

export async function toggleWishlist(propertyId: string): Promise<{
  wishlisted: boolean;
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { wishlisted: false, error: "NOT_AUTHENTICATED" };
  }

  // Check if already wishlisted
  const { data: existing } = await supabase
    .from("wishlists")
    .select("id")
    .eq("user_id", user.id)
    .eq("property_id", propertyId)
    .maybeSingle();

  if (existing) {
    // Remove from wishlist
    await supabase
      .from("wishlists")
      .delete()
      .eq("user_id", user.id)
      .eq("property_id", propertyId);

    return { wishlisted: false };
  } else {
    // Add to wishlist
    const { error } = await supabase.from("wishlists").insert({
      user_id: user.id,
      property_id: propertyId,
    });

    if (error) {
      console.error("Error adding to wishlist:", error);
      return { wishlisted: false, error: error.message };
    }

    return { wishlisted: true };
  }
}

// ─────────────────────────────────────────────────────────────
// Check if a property is wishlisted by current user
// ─────────────────────────────────────────────────────────────

export async function isWishlisted(propertyId: string): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data } = await supabase
    .from("wishlists")
    .select("id")
    .eq("user_id", user.id)
    .eq("property_id", propertyId)
    .maybeSingle();

  return !!data;
}

// ─────────────────────────────────────────────────────────────
// Get all wishlisted property IDs for current user (batch check)
// ─────────────────────────────────────────────────────────────

export async function getWishlistedIds(): Promise<string[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("wishlists")
    .select("property_id")
    .eq("user_id", user.id);

  return (data || []).map((row) => row.property_id);
}

// ─────────────────────────────────────────────────────────────
// Get wishlist count for a property
// ─────────────────────────────────────────────────────────────

export async function getWishlistCount(propertyId: string): Promise<number> {
  const supabase = await createClient();

  const { count } = await supabase
    .from("wishlists")
    .select("id", { count: "exact", head: true })
    .eq("property_id", propertyId);

  return count || 0;
}
