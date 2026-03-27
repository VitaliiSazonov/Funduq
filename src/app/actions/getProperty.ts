"use server";

import { createClient } from "@/lib/supabase/server";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface PropertyHost {
  full_name: string | null;
  avatar_url: string | null;
  verified: boolean;
  created_at: string;
}

export interface PropertyImage {
  url: string;
  order: number;
}

export interface PropertyDetail {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  type: string;
  price_min: number;
  price_max: number;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  status: string;
  location_emirate: string;
  location_district: string;
  main_image_url: string | null;
  amenities: string[] | null;
  created_at: string;
  host: PropertyHost;
  images: PropertyImage[];
}

// ─────────────────────────────────────────────────────────────
// Fetch property detail with host profile and images
// ─────────────────────────────────────────────────────────────

export async function getProperty(
  id: string
): Promise<PropertyDetail | null> {
  const supabase = await createClient();

  // Fetch the property with the owner's profile
  const { data: property, error } = await supabase
    .from("properties")
    .select(
      `
      *,
      host:profiles!properties_owner_id_fkey (
        full_name,
        avatar_url,
        verified,
        created_at
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !property) {
    return null;
  }

  // Build images list from Supabase Storage bucket
  const images: PropertyImage[] = [];

  const { data: storageFiles } = await supabase.storage
    .from("properties-images")
    .list(id, { limit: 20, sortBy: { column: "name", order: "asc" } });

  if (storageFiles && storageFiles.length > 0) {
    for (let i = 0; i < storageFiles.length; i++) {
      const file = storageFiles[i];
      // Skip folders or .emptyFolderPlaceholder
      if (!file.name || file.name.startsWith(".")) continue;
      const { data: urlData } = supabase.storage
        .from("properties-images")
        .getPublicUrl(`${id}/${file.name}`);

      if (urlData?.publicUrl) {
        images.push({ url: urlData.publicUrl, order: i });
      }
    }
  }

  // If no images from storage, use main_image_url as fallback
  if (images.length === 0 && property.main_image_url) {
    images.push({ url: property.main_image_url, order: 0 });
  }

  // Normalize host data — Supabase may return as array or object
  const hostRaw = property.host;
  const host: PropertyHost = Array.isArray(hostRaw)
    ? hostRaw[0] ?? { full_name: null, avatar_url: null, verified: false, created_at: property.created_at }
    : hostRaw ?? { full_name: null, avatar_url: null, verified: false, created_at: property.created_at };

  return {
    id: property.id,
    owner_id: property.owner_id,
    title: property.title,
    description: property.description,
    type: property.type,
    price_min: property.price_min,
    price_max: property.price_max,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    max_guests: property.max_guests,
    status: property.status,
    location_emirate: property.location_emirate,
    location_district: property.location_district,
    main_image_url: property.main_image_url,
    amenities: property.amenities,
    created_at: property.created_at,
    host,
    images,
  };
}

// ─────────────────────────────────────────────────────────────
// Fetch similar properties in the same emirate
// ─────────────────────────────────────────────────────────────

export interface SimilarProperty {
  id: string;
  title: string;
  location: string;
  bedrooms: number;
  maxGuests: number;
  priceRange: string;
  imageUrl: string;
}

export async function getSimilarProperties(
  currentId: string,
  emirate: string
): Promise<SimilarProperty[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("status", "active")
    .eq("location_emirate", emirate)
    .neq("id", currentId)
    .order("created_at", { ascending: false })
    .limit(3);

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    location: `${row.location_district}, ${row.location_emirate}`,
    bedrooms: row.bedrooms,
    maxGuests: row.max_guests,
    priceRange: `AED ${new Intl.NumberFormat().format(row.price_min)} - ${new Intl.NumberFormat().format(row.price_max)}`,
    imageUrl: row.main_image_url || "/images/props/placeholder.png",
  }));
}
