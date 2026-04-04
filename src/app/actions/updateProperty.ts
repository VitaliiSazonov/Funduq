"use server";

import { createClient } from "@/lib/supabase/server";

export interface UpdatePropertyPayload {
  propertyId: string;
  title: string;
  description: string;
  type: string;
  location_emirate: string;
  location_district: string;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  price_min: number;
  price_max: number;
  amenities: string[];
  imageUrls: string[];
}

export interface UpdateResult {
  success: boolean;
  error?: string;
}

export async function updateProperty(
  payload: UpdatePropertyPayload
): Promise<UpdateResult> {
  try {
    const supabase = await createClient();

    // 1. Verify the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "You must be signed in to update a property.",
      };
    }

    // 2. Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from("properties")
      .select("owner_id")
      .eq("id", payload.propertyId)
      .single();

    if (fetchError || !existing) {
      return { success: false, error: "Property not found." };
    }

    if (existing.owner_id !== user.id) {
      return { success: false, error: "You can only edit your own properties." };
    }

    // 3. Determine main image
    const mainImageUrl =
      payload.imageUrls.length > 0 ? payload.imageUrls[0] : null;

    // 4. Update the property
    const { error: updateError } = await supabase
      .from("properties")
      .update({
        title: payload.title,
        description: payload.description,
        type: payload.type,
        location_emirate: payload.location_emirate,
        location_district: payload.location_district,
        bedrooms: payload.bedrooms,
        bathrooms: payload.bathrooms,
        max_guests: payload.max_guests,
        price_min: payload.price_min,
        price_max: payload.price_max,
        main_image_url: mainImageUrl,
        amenities: payload.amenities,
        gallery_urls: payload.imageUrls,
      })
      .eq("id", payload.propertyId);

    if (updateError) {
      console.error("Error updating property:", updateError);
      return {
        success: false,
        error: "Failed to update property. Please try again.",
      };
    }

    return { success: true };
  } catch (err) {
    console.error("Unexpected error updating property:", err);
    return {
      success: false,
      error: "An unexpected error occurred.",
    };
  }
}
