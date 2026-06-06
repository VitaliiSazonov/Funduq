"use client";

import { useState, useMemo } from "react";
import {
  CalendarDays,
  Luggage,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  Loader,
  Filter,
  X,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { format, parseISO, isPast, startOfDay, endOfDay } from "date-fns";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import type { GuestBookingRequest } from "@/app/actions/booking-requests";

/* ── helpers ─────────────────────────────────────────────── */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function buildVillaUrl(id: string, title: string): string {
  return `/villas/${slugify(title)}-${id}`;
}

/* ── types ───────────────────────────────────────────────── */
type StatusKey = "Request" | "OnProcess" | "Confirmed" | "Checkout" | "Cancel";

export interface GuestBookingsTranslations {
  browseVillas: string;
  yourStays: string;
  myBookings: string;
  trackStays: string;
  upcoming: string;
  noUpcomingStays: string;
  findNextRetreat: string;
  exploreVillas: string;
  request: string;
  onProcess: string;
  confirmed: string;
  checkout: string;
  cancel: string;
  guest: string;
  guests: string;
  pastAndCancelled: string;
  filterByStatus: string;
  filterByDate: string;
  allStatuses: string;
  from: string;
  to: string;
  clearFilters: string;
  activeFilters: string;
  noResults: string;
  noResultsHint: string;
  viewProperty: string;
}

interface Props {
  bookings: GuestBookingRequest[];
  t: GuestBookingsTranslations;
}

/* ── component ───────────────────────────────────────────── */
export default function GuestBookingsClient({ bookings, t }: Props) {
  /* filter state */
  const [statusFilter, setStatusFilter] = useState<StatusKey | "all">("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters =
    statusFilter !== "all" || !!dateRange?.from || !!dateRange?.to;

  /* status config */
  function statusConfig(status: string) {
    const map: Record<
      string,
      { label: string; bg: string; icon: React.ReactNode }
    > = {
      Request: {
        label: t.request,
        bg: "bg-amber-100 text-amber-700",
        icon: <Clock className="w-3 h-3" />,
      },
      OnProcess: {
        label: t.onProcess,
        bg: "bg-blue-100 text-blue-700",
        icon: <Loader className="w-3 h-3" />,
      },
      Confirmed: {
        label: t.confirmed,
        bg: "bg-green-100 text-green-700",
        icon: <CheckCircle2 className="w-3 h-3" />,
      },
      Checkout: {
        label: t.checkout,
        bg: "bg-gray-100 text-gray-500",
        icon: <CheckCircle2 className="w-3 h-3" />,
      },
      Cancel: {
        label: t.cancel,
        bg: "bg-red-100 text-red-600",
        icon: <XCircle className="w-3 h-3" />,
      },
    };
    return map[status] || map.Request;
  }

  /* filter logic */
  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      // Status filter
      if (statusFilter !== "all" && b.status !== statusFilter) return false;

      // Date range filter (against check_in)
      if (dateRange?.from) {
        const checkIn = parseISO(b.check_in);
        if (checkIn < startOfDay(dateRange.from)) return false;
      }
      if (dateRange?.to) {
        const checkIn = parseISO(b.check_in);
        if (checkIn > endOfDay(dateRange.to)) return false;
      }

      return true;
    });
  }, [bookings, statusFilter, dateRange]);

  /* split into upcoming vs past */
  const upcoming = filtered.filter(
    (b) =>
      !isPast(parseISO(b.check_out)) &&
      (b.status === "Request" ||
        b.status === "OnProcess" ||
        b.status === "Confirmed")
  );
  const past = filtered.filter(
    (b) =>
      isPast(parseISO(b.check_out)) ||
      b.status === "Cancel" ||
      b.status === "Checkout"
  );

  /* all unique statuses in data */
  const allStatuses: StatusKey[] = [
    "Request",
    "OnProcess",
    "Confirmed",
    "Checkout",
    "Cancel",
  ];

  function clearFilters() {
    setStatusFilter("all");
    setDateRange(undefined);
  }

  /* ── render booking card ─── */
  function renderBookingCard(
    booking: GuestBookingRequest,
    variant: "upcoming" | "past"
  ) {
    const sc = statusConfig(booking.status);
    const propertyUrl = buildVillaUrl(
      booking.property.id,
      booking.property.title
    );

    if (variant === "upcoming") {
      return (
        <Link
          key={booking.id}
          href={propertyUrl}
          className="block bg-white rounded-2xl border border-charcoal/5 overflow-hidden hover:shadow-luxury hover:border-gold/20 transition-all duration-300 group"
        >
          <div className="flex flex-col md:flex-row">
            {/* Image */}
            <div className="relative w-full md:w-56 h-44 md:h-auto shrink-0 overflow-hidden">
              <Image
                src={
                  booking.property.main_image_url ||
                  "/images/props/placeholder.png"
                }
                alt={booking.property.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* Info */}
            <div className="flex-1 p-6 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-xl font-bold text-charcoal display-font group-hover:text-gold transition-colors">
                  {booking.property.title}
                </h3>
                <span
                  className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${sc.bg}`}
                >
                  {sc.icon}
                  {sc.label}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-charcoal/50">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gold" />
                  {booking.property.location_district},{" "}
                  {booking.property.location_emirate}
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-gold" />
                  {format(parseISO(booking.check_in), "MMM d")} →{" "}
                  {format(parseISO(booking.check_out), "MMM d, yyyy")}
                </span>
                <span>
                  {booking.total_guests}{" "}
                  {booking.total_guests !== 1 ? t.guests : t.guest}
                </span>
              </div>

              {booking.message && (
                <p className="text-sm text-charcoal/40 italic border-l-2 border-gold/20 pl-3">
                  &ldquo;{booking.message}&rdquo;
                </p>
              )}

              {/* View property hint */}
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-gold opacity-0 group-hover:opacity-100 transition-opacity">
                {t.viewProperty}
                <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </Link>
      );
    }

    /* past variant — compact */
    return (
      <Link
        key={booking.id}
        href={propertyUrl}
        className="block bg-white/60 rounded-2xl border border-charcoal/5 p-5 hover:shadow-md hover:border-gold/15 transition-all duration-300 group"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-charcoal/70 group-hover:text-gold transition-colors">
                {booking.property.title}
              </h4>
              <span
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${sc.bg}`}
              >
                {sc.icon}
                {sc.label}
              </span>
            </div>
            <p className="text-sm text-charcoal/40">
              {format(parseISO(booking.check_in), "MMM d")} →{" "}
              {format(parseISO(booking.check_out), "MMM d, yyyy")} ·{" "}
              {booking.total_guests}{" "}
              {booking.total_guests !== 1 ? t.guests : t.guest}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-charcoal/20 group-hover:text-gold transition-colors shrink-0 hidden md:block" />
        </div>
      </Link>
    );
  }

  /* ── JSX ─── */
  return (
    <>
      {/* ─── Filters Bar ─── */}
      <div className="mb-8">
        {/* Toggle button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
            hasActiveFilters
              ? "bg-gold/10 text-gold border border-gold/20"
              : "bg-white text-charcoal/60 border border-charcoal/10 hover:border-charcoal/20"
          }`}
        >
          <Filter className="w-4 h-4" />
          {hasActiveFilters ? t.activeFilters : t.filterByStatus}
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
          )}
        </button>

        {/* Clear button */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="ml-3 inline-flex items-center gap-1 px-3 py-2.5 rounded-xl text-sm font-medium text-charcoal/40 hover:text-red-500 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            {t.clearFilters}
          </button>
        )}

        {/* Filter panel */}
        <div
          className={`overflow-hidden transition-all duration-300 ${
            showFilters
              ? "max-h-[500px] opacity-100 mt-4"
              : "max-h-0 opacity-0"
          }`}
        >
          <div className="bg-white rounded-2xl border border-charcoal/5 p-5 space-y-5">
            {/* Status pills */}
            <div>
              <label className="block text-xs font-black text-charcoal/30 uppercase tracking-[0.15em] mb-3">
                {t.filterByStatus}
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                    statusFilter === "all"
                      ? "bg-charcoal text-white shadow-md"
                      : "bg-charcoal/5 text-charcoal/50 hover:bg-charcoal/10"
                  }`}
                >
                  {t.allStatuses}
                </button>
                {allStatuses.map((s) => {
                  const sc = statusConfig(s);
                  return (
                    <button
                      key={s}
                      onClick={() =>
                        setStatusFilter(statusFilter === s ? "all" : s)
                      }
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                        statusFilter === s
                          ? `${sc.bg} shadow-md ring-2 ring-offset-1 ring-current/20`
                          : "bg-charcoal/5 text-charcoal/50 hover:bg-charcoal/10"
                      }`}
                    >
                      {sc.icon}
                      {sc.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date range */}
            <div>
              <label className="block text-xs font-black text-charcoal/30 uppercase tracking-[0.15em] mb-3">
                {t.filterByDate}
              </label>
              <div className="flex flex-col gap-3">
                <div className="rdp-funduq bg-offwhite rounded-xl border border-charcoal/10 p-2 overflow-x-auto">
                  <DayPicker
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={1}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── No results ─── */}
      {filtered.length === 0 && hasActiveFilters && (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 mb-16">
          <Filter className="w-10 h-10 text-charcoal/15 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-charcoal mb-1">
            {t.noResults}
          </h3>
          <p className="text-charcoal/40 text-sm mb-6">{t.noResultsHint}</p>
          <button
            onClick={clearFilters}
            className="text-gold font-bold hover:underline text-sm"
          >
            {t.clearFilters}
          </button>
        </div>
      )}

      {/* ─── Upcoming ─── */}
      {(upcoming.length > 0 || !hasActiveFilters) && (
        <section className="mb-16">
          <h2 className="text-xs font-black text-charcoal/30 uppercase tracking-[0.2em] mb-6">
            {t.upcoming} ({upcoming.length})
          </h2>

          {upcoming.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <Luggage className="w-10 h-10 text-charcoal/15 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-charcoal mb-1">
                {t.noUpcomingStays}
              </h3>
              <p className="text-charcoal/40 text-sm mb-6">
                {t.findNextRetreat}
              </p>
              <Link
                href="/villas"
                className="text-gold font-bold hover:underline text-sm"
              >
                {t.exploreVillas}
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {upcoming.map((b) => renderBookingCard(b, "upcoming"))}
            </div>
          )}
        </section>
      )}

      {/* ─── Past / Cancelled ─── */}
      {past.length > 0 && (
        <section>
          <h2 className="text-xs font-black text-charcoal/30 uppercase tracking-[0.2em] mb-6">
            {t.pastAndCancelled} ({past.length})
          </h2>
          <div className="space-y-3">
            {past.map((b) => renderBookingCard(b, "past"))}
          </div>
        </section>
      )}
    </>
  );
}
