"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
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
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { getDisabledDates } from "@/app/actions/ical";
import BookingRequestModal from "./BookingRequestModal";

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
  const t = useTranslations("bookingWidget");
  const searchParams = useSearchParams();

  const initialRange = useMemo(() => {
    const checkInStr = searchParams.get("checkIn");
    const checkOutStr = searchParams.get("checkOut");
    if (checkInStr && checkOutStr) {
      try {
        const from = parseISO(checkInStr);
        const to = parseISO(checkOutStr);
        if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
          return { from, to };
        }
      } catch {
        // invalid date
      }
    }
    return undefined;
  }, [searchParams]);

  const [range, setRange] = useState<DateRange | undefined>(initialRange);
  const [guests, setGuests] = useState<number | "">("");
  const [message, setMessage] = useState("");
  const [disabledDates, setDisabledDates] = useState<Date[]>([]);
  const [isLoadingDates, setIsLoadingDates] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0);

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

  // ─── Validation ───
  function isFormValid(): boolean {
    if (!range?.from || !range?.to || rangeHasConflict()) return false;
    if (guests === "" || guests < 1) return false;
    return true;
  }

  // ─── Precompute WhatsApp redirect URL ───
  const whatsAppUrl = useMemo(() => {
    if (!range?.from || !range?.to) return "#";

    const checkIn = format(range.from, "yyyy-MM-dd");
    const checkOut = format(range.to, "yyyy-MM-dd");
    const totalGuests = guests || 1;
    const messageToHost = message.trim();

    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_SERVICE_NUMBER || "971585825323";

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.funduq.ae";
    const waMessage = encodeURIComponent(
      `⚠️ PLEASE DO NOT EDIT OR DELETE THIS MESSAGE ⚠️\n\n` +
      `Hello! I would like to request a booking:\n` +
      `Property: ${propertyTitle}\n` +
      `ID: ${propertyId}\n` +
      `Dates: ${checkIn} to ${checkOut}\n` +
      `Guests: ${totalGuests}\n` +
      `Link: ${siteUrl}/villas/${propertyId}` +
      (messageToHost ? `\nMessage: ${messageToHost}` : ``)
    );

    return `https://wa.me/${whatsappNumber}?text=${waMessage}`;
  }, [range, guests, message, propertyTitle, propertyId]);

  // ─── Open modal to collect name + phone, then call Server Action + WhatsApp ───
  const handleRequestToBook = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;
    setResetKey((k) => k + 1); // remount modal → clears form state
    setModalOpen(true);
  };



  return (
    <>
      <div className="bg-white rounded-3xl border border-charcoal/5 shadow-luxury overflow-hidden flex flex-col max-h-[calc(100vh-6rem)]">
      {/* ─── Header ─── */}
      <div className="gold-gradient px-6 py-5 shrink-0 z-10 shadow-sm relative">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/70 font-bold mb-1">
          {t("from")}
        </p>
        <p className="text-2xl font-black text-white display-font">
          AED {new Intl.NumberFormat().format(priceMin)}
          <span className="text-white/50 text-base font-normal"> {t("perNight")}</span>
        </p>
      </div>

      {/* ─── Scrollable Content ─── */}
      <div className="p-6 space-y-5 overflow-y-auto overflow-x-hidden flex-1">
        {/* ─── Calendar ─── */}
        <div>
          <label className="flex items-center gap-2 text-xs font-bold text-charcoal/50 uppercase tracking-wider mb-3">
            <CalendarDays className="w-3.5 h-3.5" />
            {t("selectDates")}
          </label>

          {isLoadingDates ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-gold animate-spin" />
              <span className="ml-2 text-sm text-charcoal/40">
                {t("loadingAvailability")}
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
                  {nights} {nights !== 1 ? t("nights") : t("night")}
                </span>
              )}
            </div>
          )}

          {/* Conflict warning */}
          {rangeHasConflict() && (
            <div className="mt-2 flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-xl">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {t("datesUnavailable")}
            </div>
          )}
        </div>

        {/* ─── Guests ─── */}
        <div>
          <label className="flex items-center gap-2 text-xs font-bold text-charcoal/50 uppercase tracking-wider mb-2">
            <Users className="w-3.5 h-3.5" />
            {t("guests")}
          </label>
          <select
            value={guests}
            onChange={(e) => setGuests(e.target.value === "" ? "" : Number(e.target.value))}
            required
            className={`w-full px-4 py-3 bg-offwhite border rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-gold/40 transition-all appearance-none ${
              guests === ""
                ? "border-charcoal/10 text-charcoal/40"
                : "border-charcoal/10 text-charcoal"
            }`}
          >
            <option value="" disabled>
              {t("selectGuests")}
            </option>
            {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} {n !== 1 ? t("guestsPlural") : t("guest")}
              </option>
            ))}
          </select>
        </div>



        {/* ─── Message (optional) ─── */}
        <div>
          <label className="flex items-center gap-2 text-xs font-bold text-charcoal/50 uppercase tracking-wider mb-2">
            <MessageSquare className="w-3.5 h-3.5" />
            {t("messageToHost")}
            <span className="text-charcoal/25 font-normal normal-case">{t("optional")}</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder={t("messagePlaceholder")}
            className="w-full px-4 py-3 bg-offwhite border border-charcoal/10 rounded-xl text-charcoal placeholder:text-charcoal/25 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 transition-all resize-none"
          />
        </div>
      </div>

      {/* ─── Sticky Bottom (Submit) ─── */}
      <div className="p-6 bg-white border-t border-charcoal/5 shrink-0 shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.03)] z-10 relative space-y-4">
        {/* ─── Price Estimate ─── */}
        {nights > 0 && (
          <div className="bg-offwhite rounded-2xl p-4 space-y-2">
            <div className="flex justify-between text-sm text-charcoal/60">
              <span>
                AED {new Intl.NumberFormat().format(Math.round((priceMin + priceMax) / 2))} × {nights} {nights !== 1 ? t("nights") : t("night")}
              </span>
              <span className="font-semibold text-charcoal">
                AED {new Intl.NumberFormat().format(Math.round(estimatedTotal))}
              </span>
            </div>
            <p className="text-[10px] text-charcoal/30 uppercase tracking-wider">
              {t("estimatedTotal")}
            </p>
          </div>
        )}

        {/* ─── Submit ─── */}
        <button
          id="booking-submit-btn"
          type="button"
          onClick={handleRequestToBook}
          data-testid="request-to-book-btn"
          disabled={!isFormValid()}
          className={`w-full flex items-center justify-center gap-2 px-6 py-4 gold-gradient text-white rounded-2xl font-bold text-base hover:opacity-90 transition-opacity ${
            !isFormValid() ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          {t("requestToBook")}
        </button>

        <p className="text-center text-[10px] text-charcoal/30 uppercase tracking-wider">
          {t("noPaymentRequired")}
        </p>
      </div>
    </div>

      {/* ─── Booking Request Modal ─── */}
      <BookingRequestModal
        key={resetKey}
        open={modalOpen}
        onOpenChange={setModalOpen}
        propertyId={propertyId}
        checkIn={range?.from ? format(range.from, "yyyy-MM-dd") : undefined}
        checkOut={range?.to ? format(range.to, "yyyy-MM-dd") : undefined}
        totalGuests={guests || 1}
        message={message || undefined}
        whatsappUrl={whatsAppUrl}
      />
    </>
  );
}
