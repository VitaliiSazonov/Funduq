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
  amenities: string[];
  locationEmirate: string;
  locationDistrict: string;
}

export interface ImportResult {
  success: boolean;
  data?: AirbnbScrapedData & { uploadedImageUrls: string[] };
  error?: string;
}

// ─────────────────────────────────────────────────────────────
// Helper: Download external images → Upload to Supabase Storage
// Downloads ALL images concurrently (up to 30) for speed
// ─────────────────────────────────────────────────────────────
export async function downloadAndUploadToSupabase(
  imageUrls: string[],
  propertyId: string
): Promise<string[]> {
  const supabase = await createClient();

  // Process up to 30 images
  const urlsToProcess = imageUrls.slice(0, 30);

  // Upload images concurrently for better performance
  const uploadPromises = urlsToProcess.map(async (url, i) => {
    try {
      // Fetch the external image
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });
      if (!response.ok) {
        console.error(`Failed to download image ${i}: ${response.statusText}`);
        return null;
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
        return null;
      }

      // Get the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("properties-images").getPublicUrl(filePath);

      return { index: i, url: publicUrl };
    } catch (err) {
      console.error(`Error processing image ${i}:`, err);
      return null;
    }
  });

  // Wait for all concurrent uploads
  const results = await Promise.all(uploadPromises);

  // Sort by original index to maintain order, filter nulls
  return results
    .filter((r): r is { index: number; url: string } => r !== null)
    .sort((a, b) => a.index - b.index)
    .map((r) => r.url);
}

// ─────────────────────────────────────────────────────────────
// Airbnb Location → Funduq Emirate/District mapping
// ─────────────────────────────────────────────────────────────
const LOCATION_MAP: Record<string, { emirate: string; district: string }> = {
  "dubai marina": { emirate: "Dubai", district: "Dubai Marina" },
  "palm jumeirah": { emirate: "Dubai", district: "Palm Jumeirah" },
  "downtown dubai": { emirate: "Dubai", district: "Downtown Dubai" },
  "jumeirah beach residence": { emirate: "Dubai", district: "Jumeirah Beach Residence" },
  jbr: { emirate: "Dubai", district: "Jumeirah Beach Residence" },
  jumeirah: { emirate: "Dubai", district: "Jumeirah" },
  "al barari": { emirate: "Dubai", district: "Al Barari" },
  "emirates hills": { emirate: "Dubai", district: "Emirates Hills" },
  "arabian ranches": { emirate: "Dubai", district: "Arabian Ranches" },
  "damac hills": { emirate: "Dubai", district: "Damac Hills" },
  "dubai hills": { emirate: "Dubai", district: "Dubai Hills Estate" },
  "dubai hills estate": { emirate: "Dubai", district: "Dubai Hills Estate" },
  "business bay": { emirate: "Dubai", district: "Business Bay" },
  difc: { emirate: "Dubai", district: "DIFC" },
  "bluewaters island": { emirate: "Dubai", district: "Bluewaters Island" },
  bluewaters: { emirate: "Dubai", district: "Bluewaters Island" },
  "dubai creek harbour": { emirate: "Dubai", district: "Dubai Creek Harbour" },
  "mbr city": { emirate: "Dubai", district: "MBR City" },
  "al sufouh": { emirate: "Dubai", district: "Al Sufouh" },
  "umm suqeim": { emirate: "Dubai", district: "Umm Suqeim" },
  mirdif: { emirate: "Dubai", district: "Mirdif" },
  "saadiyat island": { emirate: "Abu Dhabi", district: "Saadiyat Island" },
  "yas island": { emirate: "Abu Dhabi", district: "Yas Island" },
  "al reem island": { emirate: "Abu Dhabi", district: "Al Reem Island" },
  "al raha beach": { emirate: "Abu Dhabi", district: "Al Raha Beach" },
  "nurai island": { emirate: "Abu Dhabi", district: "Nurai Island" },
  "al marjan island": { emirate: "Ras Al Khaimah", district: "Al Marjan Island" },
  "al hamra village": { emirate: "Ras Al Khaimah", district: "Al Hamra Village" },
};

function resolveLocation(locationText: string): { emirate: string; district: string } {
  const lower = locationText.toLowerCase();

  // Try direct match from the map
  for (const [key, value] of Object.entries(LOCATION_MAP)) {
    if (lower.includes(key)) return value;
  }

  // Try to detect emirate name at minimum
  const emirateNames = [
    "Dubai", "Abu Dhabi", "Sharjah", "Ajman",
    "Ras Al Khaimah", "Fujairah", "Umm Al Quwain",
  ];
  for (const emirate of emirateNames) {
    if (lower.includes(emirate.toLowerCase())) {
      return { emirate, district: "" };
    }
  }

  return { emirate: "", district: "" };
}

// ─────────────────────────────────────────────────────────────
// Deep JSON search utilities
// ─────────────────────────────────────────────────────────────
/* eslint-disable @typescript-eslint/no-explicit-any */
function deepFind(obj: any, predicate: (key: string, val: any) => boolean): any {
  if (!obj || typeof obj !== "object") return undefined;
  for (const key of Object.keys(obj)) {
    if (predicate(key, obj[key])) return obj[key];
    const found = deepFind(obj[key], predicate);
    if (found !== undefined) return found;
  }
  return undefined;
}

function deepFindAll(obj: any, predicate: (key: string, val: any) => boolean): any[] {
  const results: any[] = [];
  function walk(o: any) {
    if (!o || typeof o !== "object") return;
    for (const key of Object.keys(o)) {
      if (predicate(key, o[key])) results.push(o[key]);
      walk(o[key]);
    }
  }
  walk(obj);
  return results;
}

function deepCollectStrings(obj: any, key: string): string[] {
  const results: string[] = [];
  function walk(o: any) {
    if (!o || typeof o !== "object") return;
    for (const k of Object.keys(o)) {
      if (k === key && typeof o[k] === "string") results.push(o[k]);
      walk(o[k]);
    }
  }
  walk(obj);
  return results;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ─────────────────────────────────────────────────────────────
// Strategy 1: Apify API (guaranteed, no blocking)
// Uses tri_angle/airbnb-scraper actor via REST API
// ─────────────────────────────────────────────────────────────
/* eslint-disable @typescript-eslint/no-explicit-any */
async function scrapeViaApify(roomId: string): Promise<AirbnbScrapedData | null> {
  const apiToken = process.env.APIFY_API_TOKEN;
  if (!apiToken) {
    console.warn("APIFY_API_TOKEN not set — skipping Apify, falling back to direct scrape.");
    return null;
  }

  const roomUrl = `https://www.airbnb.com/rooms/${roomId}`;

  try {
    // Run the actor synchronously (waits for result)
    const runResponse = await fetch(
      `https://api.apify.com/v2/acts/tri_angle~airbnb-scraper/run-sync-get-dataset-items?token=${apiToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startUrls: [{ url: roomUrl }],
          maxItems: 1,
          currency: "AED",
          proxyConfiguration: {
            useApifyProxy: true,
          },
        }),
      }
    );

    if (!runResponse.ok) {
      console.error(`Apify API error: ${runResponse.status} ${runResponse.statusText}`);
      return null;
    }

    const items: any[] = await runResponse.json();
    if (!items || items.length === 0) {
      console.warn("Apify returned empty dataset.");
      return null;
    }

    const listing = items[0];

    // ── Title ──
    let title = listing.title || listing.name || "";
    // Clean up Airbnb suffix from title
    title = title.replace(/\s*-\s*(Apartments|Villas|Houses|Condos|Homes).*$/i, "").trim();

    // ── Description ──
    const description = listing.description || "";

    // ── Room details from subDescription.items ──
    // Format: ["4 guests", "2 bedrooms", "3 beds", "2 baths"]
    let bedrooms = 0;
    let bathrooms = 0;
    let maxGuests = listing.personCapacity || 0;

    if (listing.subDescription?.items && Array.isArray(listing.subDescription.items)) {
      for (const item of listing.subDescription.items) {
        const lower = (item as string).toLowerCase();
        const numMatch = lower.match(/(\d+)/);
        if (!numMatch) continue;
        const num = parseInt(numMatch[1], 10);
        if (lower.includes("guest")) maxGuests = maxGuests || num;
        else if (lower.includes("bedroom") || lower.includes("studio")) bedrooms = num || 1;
        else if (lower.includes("bath")) bathrooms = num;
      }
    }

    // ── Images ──
    const imageUrls: string[] = [];
    // Thumbnail is the main image
    if (listing.thumbnail) {
      imageUrls.push(listing.thumbnail);
    }
    // Additional images from the images array
    if (listing.images && Array.isArray(listing.images)) {
      for (const img of listing.images) {
        const url = typeof img === "string" ? img : (img.url || img.baseUrl || "");
        if (url && !imageUrls.includes(url)) {
          imageUrls.push(url);
        }
      }
    }

    // ── Price ──
    let pricePerNight = 0;
    if (listing.price) {
      if (typeof listing.price === "object" && listing.price.amount) {
        const priceStr = String(listing.price.amount).replace(/[^0-9.]/g, "");
        pricePerNight = parseFloat(priceStr) || 0;
      } else if (typeof listing.price === "object" && listing.price.label) {
        // "AED 1,200 per night"
        const priceStr = String(listing.price.label).replace(/[^0-9.]/g, "");
        pricePerNight = parseFloat(priceStr) || 0;
      }
    }

    // ── Amenities ──
    const amenitySet = new Set<string>();
    if (listing.amenities && Array.isArray(listing.amenities)) {
      for (const group of listing.amenities) {
        // Apify returns grouped amenities: { title: "Bathroom", values: [{title: "Hair dryer"}, ...] }
        if (group.values && Array.isArray(group.values)) {
          for (const am of group.values) {
            if (am.available === true && am.title) {
              amenitySet.add(am.title);
            }
          }
        } else if (typeof group === "string") {
          amenitySet.add(group);
        } else if (group.title && !group.values) {
          amenitySet.add(group.title);
        }
      }
    }

    // ── Location ──
    let locationText = "";
    if (listing.subDescription?.title) {
      // "Entire rental unit in Dubai, United Arab Emirates"
      locationText = listing.subDescription.title;
    }
    if (listing.locationDescriptions && Array.isArray(listing.locationDescriptions)) {
      for (const ld of listing.locationDescriptions) {
        if (ld.content) locationText += " " + ld.content;
      }
    }
    // Also check title for location hints
    locationText = locationText || title;

    const { emirate, district } = resolveLocation(locationText || title || description);

    return {
      title: decodeHtmlEntities(title),
      description: decodeHtmlEntities(description),
      bedrooms: bedrooms || 1,
      bathrooms: bathrooms || 1,
      maxGuests: maxGuests || 2,
      imageUrls: imageUrls.slice(0, 30),
      pricePerNight,
      amenities: [...amenitySet],
      locationEmirate: emirate,
      locationDistrict: district,
    };
  } catch (error) {
    console.error("Apify scraping failed:", error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Strategy 2: Direct HTML fetch (fallback, may be blocked)
// ─────────────────────────────────────────────────────────────
async function scrapeViaDirectFetch(roomId: string): Promise<AirbnbScrapedData> {
  const canonicalUrl = `https://www.airbnb.com/rooms/${roomId}`;

  const response = await fetch(canonicalUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      "Accept":
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Cache-Control": "no-cache",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Airbnb listing (HTTP ${response.status}). The listing may be unavailable or the URL is incorrect.`);
  }

  const html = await response.text();

  // ── Try to parse embedded JSON state data ──
  let stateData: any = null;

  const deferredMatch = html.match(
    /<script\s+id="data-deferred-state-0?"[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/i
  );
  if (deferredMatch?.[1]) {
    try { stateData = JSON.parse(deferredMatch[1]); } catch { /* ignore */ }
  }

  if (!stateData) {
    const nextDataMatch = html.match(
      /<script\s+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i
    );
    if (nextDataMatch?.[1]) {
      try { stateData = JSON.parse(nextDataMatch[1]); } catch { /* ignore */ }
    }
  }

  if (!stateData) {
    const jsonBlobs = html.matchAll(
      /<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/gi
    );
    for (const match of jsonBlobs) {
      if (match[1] && match[1].length > 5000) {
        try {
          const parsed = JSON.parse(match[1]);
          const str = JSON.stringify(parsed);
          if (str.includes("pdpSections") || str.includes("listingTitle") || str.includes("roomTypeCategory")) {
            stateData = parsed;
            break;
          }
        } catch { /* ignore */ }
      }
    }
  }

  let title = "";
  let description = "";
  let bedrooms = 0;
  let bathrooms = 0;
  let maxGuests = 0;
  let imageUrls: string[] = [];
  let pricePerNight = 0;
  let amenities: string[] = [];
  let locationText = "";

  if (stateData) {
    title = deepFind(stateData, (k) => k === "listingTitle") || "";

    const descObj = deepFind(stateData, (k) => k === "description" || k === "listingDescription");
    if (typeof descObj === "string") {
      description = descObj;
    } else if (descObj && typeof descObj === "object") {
      description = descObj.htmlDescription || descObj.description || descObj.value || descObj.content || "";
      description = description.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, "");
    }
    if (!description) {
      const sectionDescs = deepFindAll(stateData, (k, v) => k === "htmlDescription" && typeof v === "string");
      if (sectionDescs.length > 0) {
        description = sectionDescs.join("\n\n").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, "");
      }
    }

    const overviewItems = deepFindAll(stateData, (k, v) => k === "overviewItems" && Array.isArray(v));
    for (const items of overviewItems) {
      for (const item of items) {
        const label = (item.title || item.label || item.value || "").toLowerCase();
        const numMatch = label.match(/(\d+)/);
        if (!numMatch) continue;
        const num = parseInt(numMatch[1], 10);
        if (label.includes("guest")) maxGuests = num;
        else if (label.includes("bedroom")) bedrooms = num;
        else if (label.includes("bath")) bathrooms = num;
      }
    }

    if (!bedrooms) { const v = deepFind(stateData, (k) => k === "bedrooms" || k === "bedroomCount"); if (typeof v === "number") bedrooms = v; }
    if (!bathrooms) { const v = deepFind(stateData, (k) => k === "bathrooms" || k === "bathroomCount"); if (typeof v === "number") bathrooms = v; }
    if (!maxGuests) { const v = deepFind(stateData, (k) => k === "personCapacity" || k === "maxGuestCapacity"); if (typeof v === "number") maxGuests = v; }

    if (!bedrooms || !bathrooms || !maxGuests) {
      const subtitles = deepCollectStrings(stateData, "subtitle");
      for (const sub of subtitles) {
        const gm = sub.match(/(\d+)\s*guest/i);
        const bm = sub.match(/(\d+)\s*bedroom/i);
        const btm = sub.match(/(\d+)\s*bath/i);
        if (gm && !maxGuests) maxGuests = parseInt(gm[1], 10);
        if (bm && !bedrooms) bedrooms = parseInt(bm[1], 10);
        if (btm && !bathrooms) bathrooms = parseInt(btm[1], 10);
      }
    }

    const allImageUrls = new Set<string>();
    const photoArrays = deepFindAll(stateData, (k, v) => (k === "photos" || k === "images" || k === "mediaItems") && Array.isArray(v));
    for (const photos of photoArrays) {
      for (const photo of photos) {
        const imgUrl = photo.baseUrl || photo.url || photo.large || photo.xlarge || "";
        if (imgUrl && imgUrl.startsWith("http")) allImageUrls.add(imgUrl.replace(/\?.*$/, "?im_w=1200"));
      }
    }
    const picUrls = deepCollectStrings(stateData, "baseUrl");
    for (const pu of picUrls) {
      if (pu.startsWith("http") && (pu.includes("muscache") || pu.includes("airbnb"))) {
        allImageUrls.add(pu.replace(/\?.*$/, "?im_w=1200"));
      }
    }
    imageUrls = [...allImageUrls].slice(0, 30);

    const priceVal = deepFind(stateData, (k) => k === "pricePerNight") || deepFind(stateData, (k) => k === "ratePerNight") || deepFind(stateData, (k) => k === "basePrice");
    if (typeof priceVal === "number") pricePerNight = priceVal;
    else if (typeof priceVal === "string") pricePerNight = parseFloat(priceVal.replace(/[^0-9.]/g, "")) || 0;

    const amenityGroups = deepFindAll(stateData, (k, v) => (k === "amenities" || k === "previewAmenities") && Array.isArray(v));
    const amenitySet = new Set<string>();
    for (const group of amenityGroups) {
      for (const am of group) {
        const name = am.title || am.name || (typeof am === "string" ? am : "");
        if (name) amenitySet.add(name);
      }
    }
    amenities = [...amenitySet];

    locationText = deepFind(stateData, (k) => k === "locationTitle") || deepFind(stateData, (k) => k === "city") || "";
    if (!locationText) {
      const neighborhood = deepFind(stateData, (k) => k === "neighborhood");
      const city = deepFind(stateData, (k) => k === "city");
      if (neighborhood && city) locationText = `${neighborhood}, ${city}`;
      else locationText = city || neighborhood || "";
    }
  }

  // Fallback: meta tags
  if (!title) { const m = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i); title = m?.[1] || ""; }
  if (!description) {
    const m = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i);
    description = m?.[1] || "";
    if (!description) { const md = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i); description = md?.[1] || ""; }
  }
  if (!bedrooms || !bathrooms || !maxGuests) {
    const gm = description.match(/(\d+)\s*guest/i);
    const bm = description.match(/(\d+)\s*bedroom/i);
    const btm = description.match(/(\d+)\s*bath/i);
    if (gm && !maxGuests) maxGuests = parseInt(gm[1], 10);
    if (bm && !bedrooms) bedrooms = parseInt(bm[1], 10);
    if (btm && !bathrooms) bathrooms = parseInt(btm[1], 10);
  }
  if (imageUrls.length === 0) {
    const ogImages = html.matchAll(/<meta\s+property="og:image"\s+content="([^"]+)"/gi);
    for (const m of ogImages) { if (m[1]) imageUrls.push(m[1]); }
  }
  if (!locationText) locationText = title;

  const { emirate, district } = resolveLocation(locationText || title || description);

  if (!title) {
    throw new Error("Could not extract listing data. Airbnb may have blocked the request. Try again later or check the URL.");
  }

  return {
    title: decodeHtmlEntities(title),
    description: decodeHtmlEntities(description),
    bedrooms: bedrooms || 1,
    bathrooms: bathrooms || 1,
    maxGuests: maxGuests || 2,
    imageUrls,
    pricePerNight,
    amenities,
    locationEmirate: emirate,
    locationDistrict: district,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ─────────────────────────────────────────────────────────────
// Main scraper: Apify first → Direct fetch fallback
// ─────────────────────────────────────────────────────────────
async function scrapeAirbnbListing(url: string): Promise<AirbnbScrapedData> {
  if (!url.includes("airbnb.com") && !url.includes("airbnb.")) {
    throw new Error("Invalid Airbnb URL. Please provide a valid Airbnb listing link.");
  }

  const roomMatch = url.match(/rooms\/(\d+)/);
  if (!roomMatch) {
    throw new Error("Could not find a listing ID in the URL. Please use a direct listing URL like airbnb.com/rooms/12345.");
  }
  const roomId = roomMatch[1];

  // Strategy 1: Apify (reliable, handles anti-bot)
  const apifyResult = await scrapeViaApify(roomId);
  if (apifyResult) return apifyResult;

  // Strategy 2: Direct HTML fetch (free, but may be blocked)
  return scrapeViaDirectFetch(roomId);
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&nbsp;/g, " ");
}

// ─────────────────────────────────────────────────────────────
// Server Action: Import from Airbnb
// ─────────────────────────────────────────────────────────────
export async function importFromAirbnb(url: string): Promise<ImportResult> {
  try {
    // 1. Scrape the listing data (including all photos + amenities)
    const scrapedData = await scrapeAirbnbListing(url);

    // 2. Generate a temporary property ID for storage organization
    const tempPropertyId = crypto.randomUUID();

    // 3. Download ALL external images → Upload to Supabase Storage
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
