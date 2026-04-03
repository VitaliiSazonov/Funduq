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

  // Add defaults for destination countries
  const defaultCountries = ["UAE", "Brazil", "Italy", "Spain"];
  defaultCountries.forEach((country) => {
    suggestions.set(`country:${country}`, {
      label: country,
      country,
      type: "country",
    });
  });

  if (data) {
    for (const row of data) {
      const country = row.location_country || "UAE";
      const emirate = row.location_emirate;
      const district = row.location_district;

      // Add country
      if (country && !suggestions.has(`country:${country}`)) {
        suggestions.set(`country:${country}`, {
          label: country,
          country,
          type: "country",
        });
      }

      // Add emirate (e.g. "Dubai")
      if (emirate) {
        const key = `emirate:${emirate}`;
        if (!suggestions.has(key)) {
          suggestions.set(key, {
            label: `${emirate}, ${country}`,
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
    { label: "UAE", country: "UAE", type: "country" },
    { label: "Brazil", country: "Brazil", type: "country" },
    { label: "Italy", country: "Italy", type: "country" },
    { label: "Spain", country: "Spain", type: "country" },
  ];
}
