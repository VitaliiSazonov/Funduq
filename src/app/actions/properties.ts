"use server"

import { createClient } from "@/lib/supabase/server";

export interface Property {
  id: string;
  title: string;
  location: string;
  locationCountry: string;
  bedrooms: number;
  maxGuests: number;
  priceMin: number;
  priceRange: string;
  imageUrl: string;
  status?: string;
  type: string;
  eventsAllowed: boolean;
}

/**
 * Transforms a Supabase property row to the frontend Property structure.
 * This aligns with the requirements for the <PropertyCard /> component.
 */
function transformProperty(row: any): Property {
  return {
    id: row.id,
    title: row.title,
    location: `${row.location_district}, ${row.location_emirate}`,
    locationCountry: row.location_country || "UAE",
    bedrooms: row.bedrooms,
    maxGuests: row.max_guests,
    priceMin: row.price_min || 0,
    priceRange: `AED ${new Intl.NumberFormat().format(row.price_min)} - ${new Intl.NumberFormat().format(row.price_max)}`,
    imageUrl: row.main_image_url || "/images/props/placeholder.png", // Fallback to placeholder
    status: row.status,
    type: row.type || "Villa",
    eventsAllowed: row.events_allowed || false,
  }
}

/**
 * Fetches the top 6 properties where status is 'active', ordered by most recent.
 */
export async function getFeaturedProperties(): Promise<Property[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .in("status", ["active", "pending_review"])
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    console.error("Error fetching featured properties:", error);
    return [];
  }

  return (data || []).map(transformProperty);
}

/**
 * Fetches newly confirmed (active) properties created within the last 24 hours.
 * Returns up to 20 properties, ordered by most recent first.
 * Used by the "Latest Arrivals" section on the homepage.
 */
export async function getLatestArrivals(): Promise<Property[]> {
  const supabase = await createClient();

  // Calculate the timestamp for 24 hours ago
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("status", "active")
    .gte("created_at", twentyFourHoursAgo)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error fetching latest arrivals:", error);
    return [];
  }

  return (data || []).map(transformProperty);
}

export type SortOption = "price_asc" | "price_desc" | "newest";

export interface PropertyFilters {
  location?: string;
  bedrooms?: number | number[];
  type?: string;
  events?: string;
  sort?: SortOption;
}

/**
 * Fetches active properties for the Catalogue page, with optional filtering.
 */
export async function getAllProperties(filters?: PropertyFilters): Promise<Property[]> {
  const supabase = await createClient();

  // Determine sort order
  const sort = filters?.sort || "newest";

  let query = supabase
    .from("properties")
    .select("*")
    .eq("status", "active");

  // Apply sort order
  if (sort === "price_asc") {
    query = query.order("price_min", { ascending: true });
  } else if (sort === "price_desc") {
    query = query.order("price_min", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  // Location filter — match against location_country
  if (filters?.location) {
    query = query.ilike("location_country", filters.location);
  }

  // Bedrooms filter — supports single value (gte for 1-3 & 6+, exact for 4-5) or multi-select array
  if (filters?.bedrooms) {
    const bed = filters.bedrooms;
    if (Array.isArray(bed)) {
      // Multi-select: split into exact matches and gte(6)
      const exactValues = bed.filter((b) => b < 6);
      const hasGte6 = bed.includes(6);
      if (exactValues.length > 0 && hasGte6) {
        // Combine: bedrooms IN (exactValues) OR bedrooms >= 6
        query = query.or(`bedrooms.in.(${exactValues.join(',')}),bedrooms.gte.6`);
      } else if (exactValues.length > 0) {
        query = query.in("bedrooms", exactValues);
      } else if (hasGte6) {
        query = query.gte("bedrooms", 6);
      }
    } else if (bed <= 3) {
      // 1+, 2+, 3+ — at least N bedrooms
      query = query.gte("bedrooms", bed);
    } else if (bed === 6) {
      // 6+ — at least 6 bedrooms
      query = query.gte("bedrooms", 6);
    } else {
      // 4 or 5 — exact match
      query = query.eq("bedrooms", bed);
    }
  }

  // Type filter — case-insensitive match (Villa, Penthouse, Resort)
  if (filters?.type) {
    query = query.ilike("type", filters.type);
  }

  // Events filter — boolean
  if (filters?.events === "yes") {
    query = query.eq("events_allowed", true);
  } else if (filters?.events === "no") {
    query = query.eq("events_allowed", false);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching all properties:", error);
    return [];
  }

  return (data || []).map(transformProperty);
}

/**
 * Fetches properties belonging exclusively to the currently authenticated user.
 */
export async function getHostProperties(): Promise<Property[]> {
  const supabase = await createClient();

  // Get the authenticated user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("User not authenticated or error fetching user:", authError);
    return [];
  }

  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching host properties:", error);
    return [];
  }

  return (data || []).map(transformProperty);
}

/**
 * Signature property type with additional details for the showcase section.
 */
export interface SignatureProperty {
  id: string;
  title: string;
  location: string;
  imageUrl: string;
  priceRange: string;
  bedrooms: number;
  maxGuests: number;
  type: string;
}

/**
 * Fetches active properties marked for the Signature Collection showcase.
 * Returns up to 5 properties for the homepage scroll-driven section.
 */
export async function getSignatureProperties(): Promise<SignatureProperty[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("properties")
    .select("id, title, location_district, location_emirate, main_image_url, price_min, price_max, bedrooms, max_guests, type")
    .eq("status", "active")
    .eq("is_signature", true)
    .order("updated_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Error fetching signature properties:", error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    title: row.title,
    location: `${row.location_district}, ${row.location_emirate}`,
    imageUrl: row.main_image_url || "/images/props/placeholder.png",
    priceRange: `AED ${new Intl.NumberFormat().format(row.price_min)} - ${new Intl.NumberFormat().format(row.price_max)}`,
    bedrooms: row.bedrooms,
    maxGuests: row.max_guests,
    type: row.type,
  }));
}
