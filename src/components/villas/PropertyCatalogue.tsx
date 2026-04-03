"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SlidersHorizontal,
  ArrowDownZA,
  LayoutGrid,
  List,
  Search,
  MapPin,
  Bed,
  Home,
  PartyPopper,
  X,
  ChevronDown,
} from "lucide-react";
import PropertyCard from "@/components/ui/PropertyCard";
import { Property } from "@/app/actions/properties";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";

const LOCATIONS = ["UAE", "Brazil", "Italy", "Spain"];
const BEDROOM_OPTIONS = [1, 2, 3, 4, 5, 6];
const TYPE_OPTIONS = ["Villa", "Penthouse", "Resort"];
const EVENT_OPTIONS = ["yes", "no"];

interface PropertyCatalogueProps {
  initialProperties: Property[];
  initialLocation?: string;
  initialBedrooms?: number;
  initialType?: string;
  initialEvents?: string;
}

export default function PropertyCatalogue({
  initialProperties,
  initialLocation,
  initialBedrooms,
  initialType,
  initialEvents,
}: PropertyCatalogueProps) {
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(
    !!(initialLocation || initialBedrooms || initialType || initialEvents)
  );
  const t = useTranslations("villas");
  const router = useRouter();
  const pathname = usePathname();

  // Build current active filter state from URL (read-only display)
  const activeLocation = initialLocation || "";
  const activeBedrooms = initialBedrooms || 0;
  const activeType = initialType || "";
  const activeEvents = initialEvents || "";

  const hasActiveFilters = !!(activeLocation || activeBedrooms || activeType || activeEvents);

  // Navigate with updated filters
  const updateFilters = useCallback(
    (updates: { location?: string; bedrooms?: number; type?: string; events?: string }) => {
      const params = new URLSearchParams();

      const loc = updates.location !== undefined ? updates.location : activeLocation;
      const bed = updates.bedrooms !== undefined ? updates.bedrooms : activeBedrooms;
      const typ = updates.type !== undefined ? updates.type : activeType;
      const evt = updates.events !== undefined ? updates.events : activeEvents;

      if (loc) params.set("location", loc);
      if (bed) params.set("bedrooms", String(bed));
      if (typ) params.set("type", typ);
      if (evt) params.set("events", evt);

      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [activeLocation, activeBedrooms, activeType, activeEvents, pathname, router]
  );

  const clearAllFilters = useCallback(() => {
    router.push(pathname);
  }, [pathname, router]);

  // Client-side search on top of server-filtered data
  const filteredProperties = initialProperties.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase())
  );

  // Count active filter badges
  const filterCount = [activeLocation, activeBedrooms, activeType, activeEvents].filter(Boolean).length;

  return (
    <>
      {/* Filter Top-Bar */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-gray-100 shadow-sm py-4 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col gap-4">
          {/* Row 1: Type tabs + search */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide w-full md:w-auto pb-1 md:pb-0">
              <button
                onClick={() => updateFilters({ type: "" })}
                className={`px-4 py-2 rounded-full text-sm font-bold shadow-md transition-all ${
                  !activeType
                    ? "bg-charcoal text-white"
                    : "bg-transparent text-muted hover:bg-offwhite"
                }`}
              >
                {t("allProperties")}
              </button>
              {TYPE_OPTIONS.map((type) => (
                <button
                  key={type}
                  onClick={() => updateFilters({ type: activeType === type ? "" : type })}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                    activeType === type
                      ? "bg-gold text-white font-bold shadow-md"
                      : "hover:bg-offwhite text-muted"
                  }`}
                >
                  <Home className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                  {type === "Villa" ? t("villasTab") : type === "Penthouse" ? t("penthouses") : t("desertResorts")}
                </button>
              ))}

              <div className="w-px h-6 bg-gray-200 mx-2" />

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-full text-sm font-bold transition-colors relative ${
                  showFilters || hasActiveFilters
                    ? "border-gold text-gold-dark bg-gold/5"
                    : "border-gray-200 text-charcoal hover:border-gold"
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>{t("filters")}</span>
                {filterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gold text-white rounded-full text-[10px] font-black flex items-center justify-center">
                    {filterCount}
                  </span>
                )}
              </button>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="flex-1 md:w-64 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-gold transition-colors" />
                <input
                  type="text"
                  placeholder={t("searchPlaceholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-offwhite rounded-full text-sm font-medium border-transparent focus:border-gold/50 focus:ring-0 transition-all outline-none"
                />
              </div>
              <div className="flex items-center gap-1 border border-gray-100 rounded-lg p-1">
                <button className="p-2 bg-offwhite rounded-md text-charcoal">
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button className="p-2 text-muted hover:text-charcoal">
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Expanded Filter Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 pb-2 border-t border-gray-100">
                  {/* Location Filter */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gold" />
                      {t("filter_location")}
                    </label>
                    <div className="relative">
                      <select
                        value={activeLocation}
                        onChange={(e) => updateFilters({ location: e.target.value })}
                        className="w-full appearance-none bg-offwhite rounded-xl px-4 py-3 text-sm font-medium text-charcoal border border-transparent focus:border-gold/40 outline-none cursor-pointer pr-10"
                      >
                        <option value="">{t("filter_all_locations")}</option>
                        {LOCATIONS.map((loc) => (
                          <option key={loc} value={loc}>
                            {loc}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                    </div>
                  </div>

                  {/* Bedrooms Filter */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-1.5">
                      <Bed className="w-3.5 h-3.5 text-gold" />
                      {t("filter_bedrooms")}
                    </label>
                    <div className="flex gap-1.5 flex-wrap">
                      <button
                        onClick={() => updateFilters({ bedrooms: 0 })}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                          !activeBedrooms
                            ? "bg-charcoal text-white"
                            : "bg-offwhite text-muted hover:bg-gray-200"
                        }`}
                      >
                        {t("filter_any")}
                      </button>
                      {BEDROOM_OPTIONS.map((n) => (
                        <button
                          key={n}
                          onClick={() => updateFilters({ bedrooms: activeBedrooms === n ? 0 : n })}
                          className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                            activeBedrooms === n
                              ? "bg-gold text-white shadow-md"
                              : "bg-offwhite text-muted hover:bg-gray-200"
                          }`}
                        >
                          {n}+
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Type Filter */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-1.5">
                      <Home className="w-3.5 h-3.5 text-gold" />
                      {t("filter_type")}
                    </label>
                    <div className="relative">
                      <select
                        value={activeType}
                        onChange={(e) => updateFilters({ type: e.target.value })}
                        className="w-full appearance-none bg-offwhite rounded-xl px-4 py-3 text-sm font-medium text-charcoal border border-transparent focus:border-gold/40 outline-none cursor-pointer pr-10"
                      >
                        <option value="">{t("filter_any")}</option>
                        {TYPE_OPTIONS.map((type) => (
                          <option key={type} value={type}>
                            {type === "Villa" ? t("villasTab") : type === "Penthouse" ? t("penthouses") : t("desertResorts")}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                    </div>
                  </div>

                  {/* Events Filter */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-1.5">
                      <PartyPopper className="w-3.5 h-3.5 text-gold" />
                      {t("filter_events")}
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateFilters({ events: "" })}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          !activeEvents
                            ? "bg-charcoal text-white"
                            : "bg-offwhite text-muted hover:bg-gray-200"
                        }`}
                      >
                        {t("filter_any")}
                      </button>
                      {EVENT_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          onClick={() =>
                            updateFilters({ events: activeEvents === opt ? "" : opt })
                          }
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            activeEvents === opt
                              ? "bg-gold text-white shadow-md"
                              : "bg-offwhite text-muted hover:bg-gray-200"
                          }`}
                        >
                          {opt === "yes" ? t("filter_events_yes") : t("filter_events_no")}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Clear All */}
                {hasActiveFilters && (
                  <div className="flex justify-end pt-2 pb-1">
                    <button
                      onClick={clearAllFilters}
                      className="flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      {t("filter_clear")}
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="max-w-7xl mx-auto px-6 md:px-12 pt-6">
          <div className="flex flex-wrap gap-2">
            {activeLocation && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gold/10 text-gold-dark border border-gold/20 rounded-full text-xs font-bold">
                <MapPin className="w-3 h-3" />
                {activeLocation}
                <button onClick={() => updateFilters({ location: "" })} className="hover:text-red-400 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {activeBedrooms > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gold/10 text-gold-dark border border-gold/20 rounded-full text-xs font-bold">
                <Bed className="w-3 h-3" />
                {activeBedrooms}+ {t("bedrooms")}
                <button onClick={() => updateFilters({ bedrooms: 0 })} className="hover:text-red-400 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {activeType && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gold/10 text-gold-dark border border-gold/20 rounded-full text-xs font-bold">
                <Home className="w-3 h-3" />
                {activeType}
                <button onClick={() => updateFilters({ type: "" })} className="hover:text-red-400 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {activeEvents && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gold/10 text-gold-dark border border-gold/20 rounded-full text-xs font-bold">
                <PartyPopper className="w-3 h-3" />
                {t("filter_events")}: {activeEvents === "yes" ? t("filter_events_yes") : t("filter_events_no")}
                <button onClick={() => updateFilters({ events: "" })} className="hover:text-red-400 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Grid Section */}
      <section className="py-12 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <span className="text-xs font-black text-muted uppercase tracking-[0.2em]">
              {filteredProperties.length} {t("propertiesFound")}
            </span>
            <button className="flex items-center gap-2 text-sm font-bold text-charcoal hover:text-gold transition-colors group">
              <ArrowDownZA className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>{t("priceLowHigh")}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProperties.length > 0 ? (
              filteredProperties.map((property, idx) => (
                <motion.div
                  key={property.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: idx * 0.05 }}
                >
                  <PropertyCard {...property} />
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center">
                <p className="text-muted text-lg font-medium">{t("noResults")}</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
