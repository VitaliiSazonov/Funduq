"use client";

import { useState } from "react";
import {
  Waves,
  Dumbbell,
  Wifi,
  Car,
  Flame,
  Wind,
  Tv,
  UtensilsCrossed,
  ShieldCheck,
  TreePine,
  Umbrella,
  WashingMachine,
  Warehouse,
  Accessibility,
  Coffee,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

// ─── Amenity → Icon mapping ───
const AMENITY_ICONS: Record<string, LucideIcon> = {
  pool: Waves,
  "swimming pool": Waves,
  gym: Dumbbell,
  fitness: Dumbbell,
  wifi: Wifi,
  "wi-fi": Wifi,
  internet: Wifi,
  parking: Car,
  "valet parking": Car,
  bbq: Flame,
  barbecue: Flame,
  grill: Flame,
  "air conditioning": Wind,
  ac: Wind,
  tv: Tv,
  television: Tv,
  "smart tv": Tv,
  kitchen: UtensilsCrossed,
  "full kitchen": UtensilsCrossed,
  security: ShieldCheck,
  "24/7 security": ShieldCheck,
  garden: TreePine,
  "private garden": TreePine,
  beach: Umbrella,
  "beach access": Umbrella,
  "private beach": Umbrella,
  laundry: WashingMachine,
  washer: WashingMachine,
  garage: Warehouse,
  elevator: Accessibility,
  lift: Accessibility,
  coffee: Coffee,
  "coffee machine": Coffee,
  concierge: Sparkles,
};

function getAmenityIcon(amenity: string): LucideIcon {
  const lower = amenity.toLowerCase().trim();
  return AMENITY_ICONS[lower] || Sparkles;
}

interface AmenitiesGridProps {
  amenities: string[];
  initialShowCount?: number;
}

export default function AmenitiesGrid({
  amenities,
  initialShowCount = 8,
}: AmenitiesGridProps) {
  const [showAll, setShowAll] = useState(false);

  const visible = showAll ? amenities : amenities.slice(0, initialShowCount);
  const hasMore = amenities.length > initialShowCount;

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {visible.map((amenity) => {
          const Icon = getAmenityIcon(amenity);
          return (
            <div
              key={amenity}
              className="flex items-center gap-3 px-4 py-3.5 bg-white rounded-2xl border border-charcoal/5 hover:border-gold/20 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4.5 h-4.5 text-gold-dark" />
              </div>
              <span className="text-sm font-medium text-charcoal/70 capitalize">
                {amenity}
              </span>
            </div>
          );
        })}
      </div>
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-4 text-sm font-bold text-gold-dark hover:text-gold transition-colors underline underline-offset-4 cursor-pointer"
        >
          {showAll
            ? "Show less"
            : `Show all ${amenities.length} amenities`}
        </button>
      )}
    </div>
  );
}
