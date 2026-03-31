"use server"

import { createClient } from "@/lib/supabase/server";

export interface Property {
  id: string;
  title: string;
  location: string;
  bedrooms: number;
  maxGuests: number;
  priceRange: string;
  imageUrl: string;
  status?: string;
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
    bedrooms: row.bedrooms,
    maxGuests: row.max_guests,
    priceRange: `AED ${new Intl.NumberFormat().format(row.price_min)} - ${new Intl.NumberFormat().format(row.price_max)}`,
    imageUrl: row.main_image_url || "/images/props/placeholder.png", // Fallback to placeholder
    status: row.status,
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
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    console.error("Error fetching featured properties:", error);
    return [];
  }

  return (data || []).map(transformProperty);
}

/**
 * Fetches active properties for the Catalogue page, with optional filtering.
 */
export async function getAllProperties(filters?: { emirate?: string }): Promise<Property[]> {
  const supabase = await createClient();

  let query = supabase
    .from("properties")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (filters?.emirate) {
    query = query.eq("location_emirate", filters.emirate);
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
