"use server";

import { createClient } from "@/lib/supabase/server";

// ─────────────────────────────────────────────────────────────
// Types: The exact JSON structure we expect from the scraping API
// ─────────────────────────────────────────────────────────────
export interface AirbnbScrapedData {
  title: string;
  description: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  imageUrls: string[];
  pricePerNight: number;
}

export interface ImportResult {
  success: boolean;
  data?: AirbnbScrapedData & { uploadedImageUrls: string[] };
  error?: string;
}

// ─────────────────────────────────────────────────────────────
// Helper: Download external images → Upload to Supabase Storage
// ─────────────────────────────────────────────────────────────
export async function downloadAndUploadToSupabase(
  imageUrls: string[],
  propertyId: string
): Promise<string[]> {
  const supabase = await createClient();
  const uploadedUrls: string[] = [];

  for (let i = 0; i < imageUrls.length; i++) {
    try {
      // Fetch the external image
      const response = await fetch(imageUrls[i]);
      if (!response.ok) {
        console.error(`Failed to download image ${i}: ${response.statusText}`);
        continue;
      }

      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      // Determine file extension from content-type
      const contentType = response.headers.get("content-type") || "image/jpeg";
      const ext = contentType.includes("png")
        ? "png"
        : contentType.includes("webp")
        ? "webp"
        : "jpg";

      const filePath = `${propertyId}/${Date.now()}_${i}.${ext}`;

      // Upload to Supabase Storage bucket
      const { error: uploadError } = await supabase.storage
        .from("properties-images")
        .upload(filePath, buffer, {
          contentType,
          upsert: false,
        });

      if (uploadError) {
        console.error(`Failed to upload image ${i}:`, uploadError.message);
        continue;
      }

      // Get the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("properties-images").getPublicUrl(filePath);

      uploadedUrls.push(publicUrl);
    } catch (err) {
      console.error(`Error processing image ${i}:`, err);
      continue;
    }
  }

  return uploadedUrls;
}

// ─────────────────────────────────────────────────────────────
// Mock Scraping Function
// In production, replace with a real API call (e.g., Apify, ScrapingBee)
// ─────────────────────────────────────────────────────────────
async function scrapeAirbnbListing(url: string): Promise<AirbnbScrapedData> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Validate URL format
  if (!url.includes("airbnb.com") && !url.includes("airbnb.")) {
    throw new Error("Invalid Airbnb URL. Please provide a valid Airbnb listing link.");
  }

  // Return mock data that matches our expected JSON structure
  return {
    title: "Stunning Marina View Penthouse with Private Pool",
    description:
      "Experience unparalleled luxury in this breathtaking penthouse overlooking the Dubai Marina. Featuring floor-to-ceiling windows, a private infinity pool, designer furnishings by Fendi Casa, a chef's kitchen with Gaggenau appliances, and a wraparound terrace offering 270° panoramic views of the Arabian Gulf and the Palm Jumeirah.",
    bedrooms: 4,
    bathrooms: 5,
    maxGuests: 8,
    imageUrls: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80",
    ],
    pricePerNight: 4500,
  };
}

// ─────────────────────────────────────────────────────────────
// Server Action: Import from Airbnb
// ─────────────────────────────────────────────────────────────
export async function importFromAirbnb(url: string): Promise<ImportResult> {
  try {
    // 1. Scrape the listing data
    const scrapedData = await scrapeAirbnbListing(url);

    // 2. Generate a temporary property ID for storage organization
    const tempPropertyId = crypto.randomUUID();

    // 3. Download external images → Upload to Supabase Storage
    const uploadedImageUrls = await downloadAndUploadToSupabase(
      scrapedData.imageUrls,
      tempPropertyId
    );

    if (uploadedImageUrls.length === 0) {
      // If storage upload fails, still return data but with original URLs for preview
      // The wizard will handle re-uploading
      console.warn("No images uploaded to storage; returning original URLs for preview.");
    }

    return {
      success: true,
      data: {
        ...scrapedData,
        uploadedImageUrls:
          uploadedImageUrls.length > 0 ? uploadedImageUrls : scrapedData.imageUrls,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred during import.",
    };
  }
}
