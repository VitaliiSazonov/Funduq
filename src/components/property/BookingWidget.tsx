"use client";

import { useState, useEffect, useCallback } from "react";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import {
  format,
  parseISO,
  differenceInDays,
  addMonths,
  isSameDay,
} from "date-fns";
import {
  CalendarDays,
  Users,
  Loader2,
  Check,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";
import { getDisabledDates } from "@/app/actions/ical";
import { createBooking } from "@/app/actions/bookings";
import { checkVerificationStatus } from "@/app/actions/passport";
import PassportVerificationModal from "@/components/guest/PassportVerificationModal";

// ─────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────
interface BookingWidgetProps {
  propertyId: string;
  priceMin: number;
  priceMax: number;
  maxGuests: number;
  propertyTitle: string;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function BookingWidget({
  propertyId,
  priceMin,
  priceMax,
  maxGuests,
  propertyTitle,
}: BookingWidgetProps) {
  const [range, setRange] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(1);
  const [message, setMessage] = useState("");
  const [disabledDates, setDisabledDates] = useState<Date[]>([]);
  const [isLoadingDates, setIsLoadingDates] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<
    "none" | "pending" | "verified"
  >("none");

  // ─── Fetch disabled dates ───
  const fetchDates = useCallback(async () => {
    setIsLoadingDates(true);
    try {
      const dates = await getDisabledDates(propertyId);
      setDisabledDates(dates.map((d) => parseISO(d)));
    } catch {
      console.error("Failed to load availability");
    } finally {
      setIsLoadingDates(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchDates();
  }, [fetchDates]);

  // ─── Computed values ───
  const nights =
    range?.from && range?.to ? differenceInDays(range.to, range.from) : 0;
  const estimatedTotal = nights * ((priceMin + priceMax) / 2);

  // ─── Check if selected range overlaps disabled dates ───
  function rangeHasConflict(): boolean {
    if (!range?.from || !range?.to) return false;
    return disabledDates.some(
      (d) => d >= range.from! && d <= range.to!
    );
  }

  // ─── Disabled date matcher for DayPicker ───
  function isDateDisabled(date: Date): boolean {
    return disabledDates.some((d) => isSameDay(d, date));
  }

  // ─── Submit booking ───
  async function handleSubmit() {
    if (!range?.from || !range?.to || rangeHasConflict()) return;

    setIsSubmitting(true);
    setResult(null);

    // ── Passport verification gate ──
    try {
      const status = await checkVerificationStatus();
      setVerificationStatus(status);
      if (status !== "verified") {
        setShowVerification(true);
        setIsSubmitting(false);
        return; // Block booking until verified
      }
    } catch {
      // If check fails (e.g. not logged in), let createBooking handle auth
    }

    const res = await createBooking({
      propertyId,
      checkIn: format(range.from, "yyyy-MM-dd"),
      checkOut: format(range.to, "yyyy-MM-dd"),
      totalGuests: guests,
      message: message.trim() || undefined,
    });

    setIsSubmitting(false);

    if (res.success) {
      setResult({
        success: true,
        message: "Booking request sent! The host will review shortly.",
      });
      setRange(undefined);
      setMessage("");
      // Refresh disabled dates
      fetchDates();
    } else {
      setResult({ success: false, message: res.error || "Something went wrong." });
    }
  }

  // ─── Handle verification complete ───
  async function handleVerificationClose() {
    setShowVerification(false);
    // Re-check status — if now verified, auto-retry booking
    const status = await checkVerificationStatus();
    setVerificationStatus(status);
    if (status === "verified" && range?.from && range?.to) {
      handleSubmit();
    }
  }

  return (
    <div className="sticky top-8 bg-white rounded-3xl border border-charcoal/5 shadow-luxury overflow-hidden">
      {/* ─── Header ─── */}
      <div className="gold-gradient px-6 py-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/70 font-bold mb-1">
          From
        </p>
        <p className="text-2xl font-black text-white display-font">
          AED {new Intl.NumberFormat().format(priceMin)}
          <span className="text-white/50 text-base font-normal"> / night</span>
        </p>
      </div>

      <div className="p-6 space-y-5">
        {/* ─── Calendar ─── */}
        <div>
          <label className="flex items-center gap-2 text-xs font-bold text-charcoal/50 uppercase tracking-wider mb-3">
            <CalendarDays className="w-3.5 h-3.5" />
            Select Dates
          </label>

          {isLoadingDates ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-gold animate-spin" />
              <span className="ml-2 text-sm text-charcoal/40">
                Loading availability…
              </span>
            </div>
          ) : (
            <div className="rdp-funduq">
              <DayPicker
                mode="range"
                selected={range}
                onSelect={setRange}
                disabled={[
                  { before: new Date() },
                  isDateDisabled,
                ]}
                excludeDisabled
                numberOfMonths={1}
                startMonth={new Date()}
                endMonth={addMonths(new Date(), 12)}
                classNames={{
                  root: "text-sm",
                  day: "rounded-xl transition-colors",
                  selected: "bg-gold text-white font-bold",
                  range_start: "bg-gold text-white rounded-l-xl",
                  range_end: "bg-gold text-white rounded-r-xl",
                  range_middle: "bg-gold/10 text-gold-dark",
                  disabled: "text-charcoal/15 line-through",
                  today: "font-black text-gold-dark",
                }}
              />
            </div>
          )}

          {/* Date summary */}
          {range?.from && (
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-charcoal/60">
                {format(range.from, "MMM d")}
                {range.to ? ` → ${format(range.to, "MMM d")}` : " → …"}
              </span>
              {nights > 0 && (
                <span className="text-xs font-bold text-gold-dark bg-gold/10 px-2.5 py-1 rounded-full">
                  {nights} night{nights !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ─── Guests ─── */}
        <div>
          <label className="flex items-center gap-2 text-xs font-bold text-charcoal/50 uppercase tracking-wider mb-2">
            <Users className="w-3.5 h-3.5" />
            Guests
          </label>
          <select
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="w-full px-4 py-3 bg-offwhite border border-charcoal/10 rounded-xl text-charcoal font-medium focus:outline-none focus:ring-2 focus:ring-gold/40 transition-all appearance-none"
          >
            {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} Guest{n !== 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* ─── Message (optional) ─── */}
        <div>
          <label className="flex items-center gap-2 text-xs font-bold text-charcoal/50 uppercase tracking-wider mb-2">
            <MessageSquare className="w-3.5 h-3.5" />
            Message to Host
            <span className="text-charcoal/25 font-normal normal-case">(optional)</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Introduce yourself or mention any special requests…"
            className="w-full px-4 py-3 bg-offwhite border border-charcoal/10 rounded-xl text-charcoal placeholder:text-charcoal/25 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 transition-all resize-none"
          />
        </div>

        {/* ─── Price Estimate ─── */}
        {nights > 0 && (
          <div className="bg-offwhite rounded-2xl p-4 space-y-2">
            <div className="flex justify-between text-sm text-charcoal/60">
              <span>
                AED {new Intl.NumberFormat().format(Math.round((priceMin + priceMax) / 2))} × {nights} nights
              </span>
              <span className="font-semibold text-charcoal">
                AED {new Intl.NumberFormat().format(Math.round(estimatedTotal))}
              </span>
            </div>
            <p className="text-[10px] text-charcoal/30 uppercase tracking-wider">
              Estimated total · Final price confirmed by host
            </p>
          </div>
        )}

        {/* ─── Submit ─── */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!range?.from || !range?.to || isSubmitting || rangeHasConflict()}
          data-testid="request-to-book-btn"
          className="w-full flex items-center justify-center gap-2 px-6 py-4 gold-gradient text-white rounded-2xl font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Requesting…
            </>
          ) : (
            "Request to Book"
          )}
        </button>

        {/* ─── Result Feedback ─── */}
        {result && (
          <div
            data-testid="booking-result"
            data-success={result.success}
            className={`flex items-start gap-3 p-4 rounded-xl text-sm ${
              result.success
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            {result.success ? (
              <Check className="w-4 h-4 mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            )}
            {result.message}
          </div>
        )}

        {/* ─── Passport Verification Modal ─── */}
        {showVerification && (
          <PassportVerificationModal
            initialStatus={verificationStatus}
            onClose={handleVerificationClose}
          />
        )}
      </div>
    </div>
  );
}
