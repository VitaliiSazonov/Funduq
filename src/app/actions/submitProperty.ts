"use server";

import { createClient } from "@/lib/supabase/server";

export interface SubmitPropertyPayload {
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

export interface SubmitResult {
  success: boolean;
  propertyId?: string;
  error?: string;
}

export async function submitProperty(
  payload: SubmitPropertyPayload
): Promise<SubmitResult> {
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
        error: "You must be signed in as a host to create a property.",
      };
    }

    // 2. Determine main image
    const mainImageUrl = payload.imageUrls.length > 0 ? payload.imageUrls[0] : null;

    // 3. Insert the property into the database
    const { data, error } = await supabase
      .from("properties")
      .insert({
        owner_id: user.id,
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
        status: "pending_review",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error inserting property:", error);
      return {
        success: false,
        error: "Failed to create property. Please try again.",
      };
    }

    return {
      success: true,
      propertyId: data.id,
    };
  } catch (err) {
    console.error("Unexpected error submitting property:", err);
    return {
      success: false,
      error: "An unexpected error occurred.",
    };
  }
}
