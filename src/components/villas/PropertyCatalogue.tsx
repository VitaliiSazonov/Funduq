"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SlidersHorizontal,
  ArrowDownAZ,
  ArrowUpAZ,
  Clock,
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
import { Property, SortOption } from "@/app/actions/properties";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";

const LOCATIONS = ["Dubai", "Abu Dhabi", "Ras Al Khaimah", "Fujairah"];
const BEDROOM_OPTIONS = [1, 2, 3, 4, 5, 6];
const TYPE_OPTIONS = ["Villa", "Penthouse", "Resort"];
const EVENT_OPTIONS = ["yes", "no"];

interface PropertyCatalogueProps {
  initialProperties: Property[];
  initialLocation?: string;
  initialBedrooms?: number | number[];
  initialType?: string;
  initialEvents?: string;
  initialSort?: SortOption;
}

const SORT_OPTIONS: { value: SortOption; labelKey: string; icon: typeof ArrowDownAZ }[] = [
  { value: "price_asc", labelKey: "sortPriceAsc", icon: ArrowDownAZ },
  { value: "price_desc", labelKey: "sortPriceDesc", icon: ArrowUpAZ },
  { value: "newest", labelKey: "sortNewest", icon: Clock },
];

export default function PropertyCatalogue({
  initialProperties,
  initialLocation,
  initialBedrooms,
  initialType,
  initialEvents,
  initialSort,
}: PropertyCatalogueProps) {
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(
    !!(initialLocation || initialBedrooms || initialType || initialEvents)
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations("villas");
  const router = useRouter();
  const pathname = usePathname();

  // Build unique location suggestions from properties + known locations
  const allLocationSuggestions = useMemo(() => {
    const locationSet = new Set<string>();
    // Add hardcoded location countries
    LOCATIONS.forEach((loc) => locationSet.add(loc));
    // Extract unique locations from properties (e.g. "Palm Jumeirah, Dubai")
    initialProperties.forEach((p) => {
      if (p.location) locationSet.add(p.location);
      if (p.locationCountry) locationSet.add(p.locationCountry);
    });
    return Array.from(locationSet).sort();
  }, [initialProperties]);

  // Filtered suggestions based on current search input
  const suggestions = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return allLocationSuggestions.filter((loc) =>
      loc.toLowerCase().includes(q)
    );
  }, [search, allLocationSuggestions]);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset highlighted index when suggestions change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [suggestions]);

  // Handle selecting a suggestion
  const handleSelectSuggestion = useCallback((suggestion: string) => {
    setSearch(suggestion);
    setShowSuggestions(false);
    inputRef.current?.blur();
  }, []);

  // Keyboard navigation for suggestions
  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showSuggestions || suggestions.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
      } else if (e.key === "Enter" && highlightedIndex >= 0) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[highlightedIndex]);
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
      }
    },
    [showSuggestions, suggestions, highlightedIndex, handleSelectSuggestion]
  );

  // Build current active filter state from URL (read-only display)
  const activeLocation = initialLocation || "";
  // Normalise bedrooms to always be an array for multi-select
  const activeBedrooms: number[] = initialBedrooms
    ? Array.isArray(initialBedrooms)
      ? initialBedrooms
      : [initialBedrooms]
    : [];
  const activeType = initialType || "";
  const activeEvents = initialEvents || "";
  const activeSort: SortOption = initialSort || "newest";

  // Close sort menu on outside click
  useEffect(() => {
    function handleSortClickOutside(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
    }
    document.addEventListener("mousedown", handleSortClickOutside);
    return () => document.removeEventListener("mousedown", handleSortClickOutside);
  }, []);

  const hasActiveFilters = !!(activeLocation || activeBedrooms.length || activeType || activeEvents);

  // Navigate with updated filters
  const updateFilters = useCallback(
    (updates: { location?: string; bedrooms?: number[]; type?: string; events?: string; sort?: SortOption }) => {
      const params = new URLSearchParams();

      const loc = updates.location !== undefined ? updates.location : activeLocation;
      const bed = updates.bedrooms !== undefined ? updates.bedrooms : activeBedrooms;
      const typ = updates.type !== undefined ? updates.type : activeType;
      const evt = updates.events !== undefined ? updates.events : activeEvents;
      const srt = updates.sort !== undefined ? updates.sort : activeSort;

      if (loc) params.set("location", loc);
      if (bed.length > 0) params.set("bedrooms", bed.join(","));
      if (typ) params.set("type", typ);
      if (evt) params.set("events", evt);
      if (srt && srt !== "newest") params.set("sort", srt);

      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [activeLocation, activeBedrooms, activeType, activeEvents, activeSort, pathname, router]
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
  const filterCount = [activeLocation, activeBedrooms.length > 0, activeType, activeEvents].filter(Boolean).length;

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
              {/* Search with Autocomplete */}
              <div ref={searchRef} className="flex-1 md:w-64 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-gold transition-colors z-10" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={t("searchPlaceholder")}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => {
                    if (search.trim()) setShowSuggestions(true);
                  }}
                  onKeyDown={handleSearchKeyDown}
                  className="w-full pl-11 pr-4 py-2.5 bg-offwhite rounded-full text-sm font-medium border-transparent focus:border-gold/50 focus:ring-0 transition-all outline-none"
                  autoComplete="off"
                  role="combobox"
                  aria-expanded={showSuggestions && suggestions.length > 0}
                  aria-haspopup="listbox"
                  aria-autocomplete="list"
                />

                {/* Autocomplete Suggestions Dropdown */}
                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.ul
                      initial={{ opacity: 0, y: -4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.98 }}
                      transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                      role="listbox"
                      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-gray-100 overflow-hidden z-50 max-h-64 overflow-y-auto"
                    >
                      {suggestions.map((suggestion, idx) => {
                        // Highlight matching text
                        const q = search.toLowerCase();
                        const matchStart = suggestion.toLowerCase().indexOf(q);
                        const before = suggestion.slice(0, matchStart);
                        const match = suggestion.slice(matchStart, matchStart + search.length);
                        const after = suggestion.slice(matchStart + search.length);

                        return (
                          <motion.li
                            key={suggestion}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.15, delay: idx * 0.03 }}
                            role="option"
                            aria-selected={highlightedIndex === idx}
                            onClick={() => handleSelectSuggestion(suggestion)}
                            onMouseEnter={() => setHighlightedIndex(idx)}
                            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-150 ${
                              highlightedIndex === idx
                                ? "bg-gold/8 text-charcoal"
                                : "hover:bg-offwhite text-gray-700"
                            }`}
                          >
                            <MapPin
                              className={`w-4 h-4 flex-shrink-0 transition-colors ${
                                highlightedIndex === idx ? "text-gold" : "text-gray-300"
                              }`}
                            />
                            <span className="text-sm font-medium truncate">
                              {matchStart >= 0 ? (
                                <>
                                  {before}
                                  <span className="text-gold font-bold">{match}</span>
                                  {after}
                                </>
                              ) : (
                                suggestion
                              )}
                            </span>
                          </motion.li>
                        );
                      })}
                    </motion.ul>
                  )}
                </AnimatePresence>
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
                        onClick={() => updateFilters({ bedrooms: [] })}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                          activeBedrooms.length === 0
                            ? "bg-charcoal text-white"
                            : "bg-offwhite text-muted hover:bg-gray-200"
                        }`}
                      >
                        {t("filter_any")}
                      </button>
                      {BEDROOM_OPTIONS.map((n) => {
                        const isActive = activeBedrooms.includes(n);
                        // 4 and 5 are multi-selectable exact values; 1-3 and 6 are single-select
                        const isMultiSelect = n === 4 || n === 5 || n === 6;
                        return (
                          <button
                            key={n}
                            onClick={() => {
                              if (isMultiSelect) {
                                // Toggle in/out of multi-select set (only among 4, 5, 6)
                                let newBed: number[];
                                if (isActive) {
                                  newBed = activeBedrooms.filter((b) => b !== n);
                                } else {
                                  // Remove any single-select values (1-3) and add new value
                                  newBed = [...activeBedrooms.filter((b) => b >= 4), n];
                                }
                                updateFilters({ bedrooms: newBed.sort((a, b) => a - b) });
                              } else {
                                // Single-select for 1+, 2+, 3+
                                updateFilters({ bedrooms: isActive ? [] : [n] });
                              }
                            }}
                            className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                              isActive
                                ? "bg-gold text-white shadow-md"
                                : "bg-offwhite text-muted hover:bg-gray-200"
                            }`}
                          >
                            {n === 6 ? "6+" : n}
                          </button>
                        );
                      })}
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
            {activeBedrooms.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gold/10 text-gold-dark border border-gold/20 rounded-full text-xs font-bold">
                <Bed className="w-3 h-3" />
                {activeBedrooms.map((b) => (b === 6 ? "6+" : String(b))).join(", ")} {t("bedrooms")}
                <button onClick={() => updateFilters({ bedrooms: [] })} className="hover:text-red-400 transition-colors">
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
            <div ref={sortRef} className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-2 text-sm font-bold text-charcoal hover:text-gold transition-colors group"
              >
                {(() => {
                  const currentSort = SORT_OPTIONS.find((s) => s.value === activeSort) || SORT_OPTIONS[2];
                  const Icon = currentSort.icon;
                  return (
                    <>
                      <Icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span>{t(currentSort.labelKey)}</span>
                    </>
                  );
                })()}
              </button>
              <AnimatePresence>
                {showSortMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                    className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-gray-100 overflow-hidden z-50 min-w-[220px]"
                  >
                    {SORT_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      const isActive = activeSort === option.value;
                      return (
                        <button
                          key={option.value}
                          onClick={() => {
                            updateFilters({ sort: option.value });
                            setShowSortMenu(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-150 ${
                            isActive
                              ? "bg-gold/10 text-gold-dark font-bold"
                              : "hover:bg-offwhite text-gray-700"
                          }`}
                        >
                          <Icon className={`w-4 h-4 flex-shrink-0 ${
                            isActive ? "text-gold" : "text-gray-400"
                          }`} />
                          <span>{t(option.labelKey)}</span>
                          {isActive && (
                            <span className="ml-auto w-2 h-2 rounded-full bg-gold" />
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
