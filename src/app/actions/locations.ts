"use server"

import { createClient } from "@/lib/supabase/server";

export interface LocationSuggestion {
  label: string;     // Display label, e.g. "Palm Jumeirah, Dubai"
  country: string;   // Country for filter, e.g. "UAE"
  type: "district" | "emirate" | "country";
}

/**
 * Fetches distinct locations from active properties to power
 * the hero search bar autocomplete.
 * Returns a deduplicated, sorted list of location suggestions.
 */
export async function getSearchLocations(): Promise<LocationSuggestion[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("properties")
    .select("location_district, location_emirate, location_country")
    .eq("status", "active");

  if (error) {
    console.error("Error fetching locations:", error);
    return getDefaultLocations();
  }

  const suggestions = new Map<string, LocationSuggestion>();

  // Add defaults for destination emirates
  const defaultEmirates = ["Dubai", "Abu Dhabi", "Ras Al Khaimah", "Fujairah"];
  defaultEmirates.forEach((emirate) => {
    suggestions.set(`emirate:${emirate}`, {
      label: emirate,
      country: "UAE",
      type: "emirate",
    });
  });

  if (data) {
    for (const row of data) {
      const country = row.location_country || "UAE";
      
      // Enforce UAE-only market focus
      if (country !== "UAE") continue;

      const emirate = row.location_emirate;
      const district = row.location_district;

      // Add emirate (e.g. "Dubai")
      if (emirate) {
        const key = `emirate:${emirate}`;
        if (!suggestions.has(key)) {
          suggestions.set(key, {
            label: `${emirate}`, // Just show emirate name
            country,
            type: "emirate",
          });
        }
      }

      // Add district (e.g. "Palm Jumeirah, Dubai")
      if (district && emirate) {
        const key = `district:${district}:${emirate}`;
        if (!suggestions.has(key)) {
          suggestions.set(key, {
            label: `${district}, ${emirate}`,
            country,
            type: "district",
          });
        }
      }
    }
  }

  return Array.from(suggestions.values()).sort((a, b) => {
    // Sort: countries first, then emirates, then districts
    const typeOrder = { country: 0, emirate: 1, district: 2 };
    if (typeOrder[a.type] !== typeOrder[b.type]) {
      return typeOrder[a.type] - typeOrder[b.type];
    }
    return a.label.localeCompare(b.label);
  });
}

function getDefaultLocations(): LocationSuggestion[] {
  return [
    { label: "Dubai", country: "UAE", type: "emirate" },
    { label: "Abu Dhabi", country: "UAE", type: "emirate" },
    { label: "Ras Al Khaimah", country: "UAE", type: "emirate" },
    { label: "Fujairah", country: "UAE", type: "emirate" },
  ];
}
