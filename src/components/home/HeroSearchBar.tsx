"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, CalendarCheck, CalendarArrowDown, SlidersHorizontal, MapPin, Minus, Plus, X, Globe, Building2, BedDouble, Home } from "lucide-react";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import { format, addMonths } from "date-fns";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { LocationSuggestion } from "@/app/actions/locations";

interface HeroSearchBarProps {
  locations: LocationSuggestion[];
}

type ActivePanel = "location" | "dates" | "filters" | null;

const PROPERTY_TYPES = [
  { value: "all", label: "All" },
  { value: "villa", label: "Villa" },
  { value: "penthouse", label: "Penthouse" },
  { value: "resort", label: "Resort" },
] as const;

type PropertyTypeValue = (typeof PROPERTY_TYPES)[number]["value"];

export default function HeroSearchBar({ locations }: HeroSearchBarProps) {
  const t = useTranslations("home");
  const router = useRouter();

  // ─── State ───
  const [locationQuery, setLocationQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [bedrooms, setBedrooms] = useState(0);
  const [propertyType, setPropertyType] = useState<PropertyTypeValue>("all");
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // ─── Refs ───
  const barRef = useRef<HTMLDivElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);

  // ─── Filtered location suggestions ───
  const filteredLocations = useMemo(() => {
    if (!locationQuery.trim()) return locations.slice(0, 8);
    const q = locationQuery.toLowerCase();
    return locations.filter((loc) =>
      loc.label.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [locationQuery, locations]);

  // ─── Close panel on outside click ───
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setActivePanel(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ─── Detect mobile for responsive calendar ───
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ─── Reset highlight when suggestions change ───
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [filteredLocations]);

  // ─── Select a location ───
  const handleSelectLocation = useCallback((loc: LocationSuggestion) => {
    setSelectedLocation(loc);
    setLocationQuery(loc.label);
    setActivePanel("dates"); // Auto-advance to dates
  }, []);

  // ─── Keyboard navigation ───
  const handleLocationKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (activePanel !== "location") return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredLocations.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredLocations.length - 1
        );
      } else if (e.key === "Enter" && highlightedIndex >= 0) {
        e.preventDefault();
        handleSelectLocation(filteredLocations[highlightedIndex]);
      } else if (e.key === "Escape") {
        setActivePanel(null);
      }
    },
    [activePanel, filteredLocations, highlightedIndex, handleSelectLocation]
  );

  // ─── Filter display ───
  const filterDisplay = useMemo(() => {
    const parts: string[] = [];
    if (bedrooms > 0) parts.push(`${bedrooms} BR`);
    if (propertyType !== "all") {
      const label = PROPERTY_TYPES.find((t) => t.value === propertyType)?.label;
      if (label) parts.push(label);
    }
    return parts.length > 0 ? parts.join(" · ") : null;
  }, [bedrooms, propertyType]);

  // ─── Search ───
  const handleSearch = useCallback(() => {
    const params = new URLSearchParams();

    if (selectedLocation) {
      params.set("location", selectedLocation.country);
    } else if (locationQuery.trim()) {
      params.set("location", locationQuery.trim());
    }

    if (dateRange?.from) {
      params.set("checkIn", format(dateRange.from, "yyyy-MM-dd"));
    }
    if (dateRange?.to) {
      params.set("checkOut", format(dateRange.to, "yyyy-MM-dd"));
    }

    if (bedrooms > 0) {
      params.set("bedrooms", String(bedrooms));
    }

    if (propertyType !== "all") {
      params.set("type", propertyType);
    }

    const qs = params.toString();
    router.push(qs ? `/villas?${qs}` : "/villas");
  }, [selectedLocation, locationQuery, dateRange, bedrooms, propertyType, router]);

  // ─── Date displays ───
  const checkInDisplay = useMemo(() => {
    if (dateRange?.from) return format(dateRange.from, "MMM d, yyyy");
    return null;
  }, [dateRange]);

  const checkOutDisplay = useMemo(() => {
    if (dateRange?.to) return format(dateRange.to, "MMM d, yyyy");
    return null;
  }, [dateRange]);

  // ─── Icon for location type ───
  const getLocationIcon = (type: LocationSuggestion["type"]) => {
    switch (type) {
      case "country":
        return <Globe className="w-4 h-4" />;
      case "emirate":
        return <Building2 className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  return (
    <div ref={barRef} className="w-full max-w-5xl relative">
      {/* ─── Main Bar ─── */}
      <div className="glass rounded-[2rem] p-2 md:p-3 flex flex-col md:flex-row items-center gap-2 md:gap-0 luxury-shadow border border-white/20">
        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-200">
          {/* Location */}
          <div className="relative">
            <div
              onClick={() => {
                setActivePanel(activePanel === "location" ? null : "location");
                setTimeout(() => locationInputRef.current?.focus(), 100);
              }}
              className={`w-full flex items-center gap-4 px-6 py-4 cursor-pointer rounded-2xl transition-all group outline-none ${
                activePanel === "location" ? "bg-white/60 shadow-sm" : "hover:bg-white/40"
              }`}
            >
              <MapPin className={`w-5 h-5 transition-colors ${
                activePanel === "location" ? "text-gold" : "text-gold group-hover:scale-110"
              } transition-transform`} />
              <div className="flex flex-col items-start min-w-0">
                <span className="text-[10px] font-black uppercase text-muted tracking-widest">
                  {t("search_location")}
                </span>
                <span className="text-charcoal font-bold text-sm truncate max-w-[180px]">
                  {selectedLocation ? selectedLocation.label : t("search_location_placeholder")}
                </span>
              </div>
              {selectedLocation && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLocation(null);
                    setLocationQuery("");
                  }}
                  className="ml-auto p-1 hover:bg-charcoal/10 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5 text-muted" />
                </span>
              )}
            </div>
          </div>

          {/* Check-in */}
          <button
            onClick={() => setActivePanel(activePanel === "dates" ? null : "dates")}
            className={`flex items-center gap-3 px-5 py-4 cursor-pointer rounded-2xl transition-all group outline-none ${
              activePanel === "dates" ? "bg-white/60 shadow-sm" : "hover:bg-white/40"
            }`}
          >
            <CalendarArrowDown className={`w-5 h-5 flex-shrink-0 transition-colors ${
              activePanel === "dates" ? "text-gold" : "text-gold group-hover:scale-110"
            } transition-transform`} />
            <div className="flex flex-col items-start min-w-0">
              <span className="text-[10px] font-black uppercase text-muted tracking-widest">
                Check-in
              </span>
              <span className={`font-bold text-sm truncate ${checkInDisplay ? "text-charcoal" : "text-gray-400"}`}>
                {checkInDisplay || "Add date"}
              </span>
            </div>
          </button>

          {/* Check-out */}
          <div
            onClick={() => setActivePanel(activePanel === "dates" ? null : "dates")}
            className={`flex items-center gap-3 px-5 py-4 cursor-pointer rounded-2xl transition-all group outline-none ${
              activePanel === "dates" ? "bg-white/60 shadow-sm" : "hover:bg-white/40"
            }`}
          >
            <CalendarCheck className={`w-5 h-5 flex-shrink-0 transition-colors ${
              activePanel === "dates" ? "text-gold" : "text-gold group-hover:scale-110"
            } transition-transform`} />
            <div className="flex flex-col items-start min-w-0">
              <span className="text-[10px] font-black uppercase text-muted tracking-widest">
                Check-out
              </span>
              <span className={`font-bold text-sm truncate ${checkOutDisplay ? "text-charcoal" : "text-gray-400"}`}>
                {checkOutDisplay || "Add date"}
              </span>
            </div>
            {dateRange?.from && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  setDateRange(undefined);
                }}
                className="ml-auto p-1 hover:bg-charcoal/10 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5 text-muted" />
              </span>
            )}
          </div>

          {/* Filters */}
          <button
            onClick={() => setActivePanel(activePanel === "filters" ? null : "filters")}
            className={`flex items-center gap-4 px-6 py-4 cursor-pointer rounded-2xl transition-all group outline-none ${
              activePanel === "filters" ? "bg-white/60 shadow-sm" : "hover:bg-white/40"
            }`}
          >
            <SlidersHorizontal className={`w-5 h-5 transition-colors ${
              activePanel === "filters" ? "text-gold" : "text-gold group-hover:scale-110"
            } transition-transform`} />
            <div className="flex flex-col items-start min-w-0">
              <span className="text-[10px] font-black uppercase text-muted tracking-widest">
                Filters
              </span>
              <span className={`font-bold text-sm truncate ${filterDisplay ? "text-charcoal" : "text-gray-400"}`}>
                {filterDisplay || "Rooms & type"}
              </span>
            </div>
          </button>
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          className="w-full md:w-auto bg-gold text-white px-10 py-5 rounded-[1.5rem] font-black flex items-center justify-center gap-3 hover:bg-gold-dark transition-all duration-300 luxury-shadow cursor-pointer"
        >
          <Search className="w-5 h-5" />
          <span className="md:inline">{t("search_button")}</span>
        </button>
      </div>

      {/* ─── Panels ─── */}
      <AnimatePresence mode="wait">
        {/* Location Autocomplete Panel */}
        {activePanel === "location" && (
          <motion.div
            key="location-panel"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="absolute top-full left-0 right-0 md:right-auto md:w-[420px] mt-3 bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden z-50"
          >
            {/* Search Input */}
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={locationInputRef}
                  type="text"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  onKeyDown={handleLocationKeyDown}
                  placeholder={t("search_location_placeholder")}
                  className="w-full pl-11 pr-4 py-3 bg-offwhite rounded-2xl text-sm font-medium border-transparent focus:border-gold/50 focus:ring-0 transition-all outline-none"
                  autoComplete="off"
                  role="combobox"
                  aria-expanded={true}
                  aria-haspopup="listbox"
                  aria-autocomplete="list"
                />
              </div>
            </div>

            {/* Suggestions List */}
            <ul role="listbox" className="max-h-72 overflow-y-auto py-2">
              {filteredLocations.length > 0 ? (
                filteredLocations.map((loc, idx) => {
                  const q = locationQuery.toLowerCase();
                  const matchStart = loc.label.toLowerCase().indexOf(q);

                  return (
                    <motion.li
                      key={`${loc.type}:${loc.label}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.12, delay: idx * 0.02 }}
                      role="option"
                      aria-selected={highlightedIndex === idx}
                      onClick={() => handleSelectLocation(loc)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={`flex items-center gap-3.5 px-5 py-3.5 cursor-pointer transition-all duration-150 ${
                        highlightedIndex === idx
                          ? "bg-gold/8 text-charcoal"
                          : "hover:bg-offwhite text-gray-700"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                        highlightedIndex === idx
                          ? "bg-gold/15 text-gold"
                          : "bg-gray-100 text-gray-400"
                      }`}>
                        {getLocationIcon(loc.type)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold truncate">
                          {matchStart >= 0 && q ? (
                            <>
                              {loc.label.slice(0, matchStart)}
                              <span className="text-gold font-bold">
                                {loc.label.slice(matchStart, matchStart + locationQuery.length)}
                              </span>
                              {loc.label.slice(matchStart + locationQuery.length)}
                            </>
                          ) : (
                            loc.label
                          )}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                          {loc.type === "country" ? "Country" : loc.type === "emirate" ? "City" : "Area"}
                        </span>
                      </div>
                    </motion.li>
                  );
                })
              ) : (
                <li className="px-5 py-8 text-center text-sm text-muted">
                  No locations found
                </li>
              )}
            </ul>
          </motion.div>
        )}

        {/* Date Picker Panel */}
        {activePanel === "dates" && (
          <motion.div
            key="dates-panel"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="absolute top-full left-0 right-0 md:left-1/2 md:right-auto md:-translate-x-1/2 mt-3 bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden z-50 md:min-w-[660px]"
          >
            {/* Header with check-in/check-out summary */}
            <div className="px-4 md:px-8 pt-6 pb-4 border-b border-gray-100">
              <div className="grid grid-cols-2 gap-6">
                <div className={`p-3 rounded-xl border-2 transition-colors ${
                  !dateRange?.from ? "border-gold bg-gold/5" : "border-gray-100"
                }`}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-0.5">Check-in</p>
                  <p className="text-sm font-bold text-charcoal">
                    {dateRange?.from ? format(dateRange.from, "EEE, MMM d, yyyy") : "Select date"}
                  </p>
                </div>
                <div className={`p-3 rounded-xl border-2 transition-colors ${
                  dateRange?.from && !dateRange?.to ? "border-gold bg-gold/5" : "border-gray-100"
                }`}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-0.5">Check-out</p>
                  <p className="text-sm font-bold text-charcoal">
                    {dateRange?.to ? format(dateRange.to, "EEE, MMM d, yyyy") : "Select date"}
                  </p>
                </div>
              </div>
            </div>

            {/* Calendar */}
            <div className="px-3 md:px-6 py-4 rdp-funduq overflow-x-auto">
              <DayPicker
                mode="range"
                selected={dateRange}
                onSelect={(range) => {
                  setDateRange(range);
                  if (
                    range?.from &&
                    range?.to &&
                    range.from.getTime() !== range.to.getTime()
                  ) {
                    setTimeout(() => setActivePanel("filters"), 400);
                  }
                }}
                disabled={{ before: new Date() }}
                numberOfMonths={isMobile ? 1 : 2}
                startMonth={new Date()}
                endMonth={addMonths(new Date(), 12)}
              />
            </div>

            {/* Footer */}
            <div className="px-4 md:px-8 pb-5 pt-2 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={() => setDateRange(undefined)}
                className="text-xs font-bold text-gray-400 hover:text-charcoal transition-colors cursor-pointer"
              >
                Clear dates
              </button>
              {dateRange?.from && dateRange?.to && (
                <span className="text-xs font-semibold text-gold">
                  {Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))} nights
                </span>
              )}
            </div>
          </motion.div>
        )}

        {/* Filters Panel */}
        {activePanel === "filters" && (
          <motion.div
            key="filters-panel"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="absolute top-full left-0 right-0 md:left-auto md:right-4 mt-3 bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden z-50 p-6 md:w-[340px]"
          >
            {/* Bedrooms */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gold/10 flex items-center justify-center">
                  <BedDouble className="w-4.5 h-4.5 text-gold" />
                </div>
                <div>
                  <p className="text-sm font-bold text-charcoal">Bedrooms</p>
                  <p className="text-[11px] text-muted">{bedrooms === 0 ? "Any" : `${bedrooms}+ rooms`}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setBedrooms(Math.max(0, bedrooms - 1))}
                  disabled={bedrooms <= 0}
                  className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-charcoal hover:border-gold hover:text-gold transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-lg font-black text-charcoal w-6 text-center">{bedrooms === 0 ? "—" : bedrooms}</span>
                <button
                  onClick={() => setBedrooms(Math.min(10, bedrooms + 1))}
                  disabled={bedrooms >= 10}
                  className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-charcoal hover:border-gold hover:text-gold transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Property Type */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-gold/10 flex items-center justify-center">
                  <Home className="w-4.5 h-4.5 text-gold" />
                </div>
                <p className="text-sm font-bold text-charcoal">Property type</p>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {PROPERTY_TYPES.map((pt) => (
                  <button
                    key={pt.value}
                    onClick={() => setPropertyType(pt.value)}
                    className={`py-2.5 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      propertyType === pt.value
                        ? "bg-gold text-white shadow-sm"
                        : "bg-offwhite text-charcoal hover:bg-gray-200"
                    }`}
                  >
                    {pt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reset */}
            {(bedrooms > 0 || propertyType !== "all") && (
              <button
                onClick={() => {
                  setBedrooms(0);
                  setPropertyType("all");
                }}
                className="mt-4 w-full py-2 text-xs font-bold text-gray-400 hover:text-charcoal transition-colors cursor-pointer text-center"
              >
                Reset filters
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
