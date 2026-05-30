"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { X, Loader2, User, Phone } from "lucide-react";
import { createBookingRequest } from "@/app/actions/booking-requests";

// ─────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────
interface BookingRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  checkIn?: string;   // ISO "YYYY-MM-DD"
  checkOut?: string;
  totalGuests?: number;
  message?: string;
  whatsappUrl: string;
}

// ─────────────────────────────────────────────────────────────
// Validation helpers
// ─────────────────────────────────────────────────────────────
const PHONE_RE = /^[+]?[\d\s()-]{7,20}$/;

function isNameValid(v: string): boolean {
  return v.trim().length >= 2;
}

function isPhoneValid(v: string): boolean {
  return PHONE_RE.test(v.trim());
}

// ─────────────────────────────────────────────────────────────
// Form state
// ─────────────────────────────────────────────────────────────
const INITIAL_FORM = { name: "", phone: "", touchedName: false, touchedPhone: false };
type FormState = typeof INITIAL_FORM;

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function BookingRequestModal({
  open,
  onOpenChange,
  propertyId,
  checkIn,
  checkOut,
  totalGuests,
  message,
  whatsappUrl,
}: BookingRequestModalProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [isPending, startTransition] = useTransition();
  const nameRef = useRef<HTMLInputElement>(null);

  // Focus name field when modal opens (no setState — safe in useEffect)
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => nameRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const nameOk = isNameValid(form.name);
  const phoneOk = isPhoneValid(form.phone);
  const canSubmit = nameOk && phoneOk && !isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForm((p) => ({ ...p, touchedName: true, touchedPhone: true }));
    if (!canSubmit) return;

    startTransition(async () => {
      type InputType = Parameters<typeof createBookingRequest>[0];
      const base: Pick<InputType, "property_id" | "guest_name" | "guest_phone"> = {
        property_id: propertyId,
        guest_name: form.name.trim(),
        guest_phone: form.phone.trim(),
      };
      const optional: Partial<Omit<InputType, "property_id" | "guest_name" | "guest_phone">> = {};
      if (checkIn !== undefined) optional.check_in = checkIn;
      if (checkOut !== undefined) optional.check_out = checkOut;
      if (totalGuests !== undefined) optional.total_guests = totalGuests;
      if (message !== undefined && message.trim() !== "") optional.message = message.trim();
      const input: InputType = { ...base, ...optional } as InputType;

      const result = await createBookingRequest(input);

      if (!result.success) {
        console.error("[BookingRequest] DB failed:", result.error, result.code);
      }

      // Push tracking event before opening new tab
      if (typeof window !== "undefined" && window.dataLayer) {
        window.dataLayer.push({
          event: "whatsapp_click",
          event_category: "engagement",
          event_label: "request_to_book",
          page_location: window.location.href,
        });
      }

      // ALWAYS redirect to WhatsApp regardless of result
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      onOpenChange(false);
    });
  };

  if (!open) return null;

  return (
    <>
      {/* ─── Backdrop ─── */}
      <div
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-[3px] transition-opacity"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* ─── Dialog panel ─── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="brm-title"
        className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="relative w-full max-w-sm pointer-events-auto bg-white rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ─── Header ─── */}
          <div className="gold-gradient px-6 pt-6 pb-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/70 font-bold mb-1">
              Almost there
            </p>
            <h2
              id="brm-title"
              className="text-xl font-black text-white display-font"
            >
              Send a request
            </h2>
            <p className="text-white/60 text-sm mt-1">
              We&apos;ll contact you via WhatsApp
            </p>
          </div>

          {/* ─── Close button ─── */}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* ─── Form ─── */}
          <form onSubmit={handleSubmit} noValidate className="px-6 py-6 space-y-5">
            {/* Name */}
            <div>
              <label
                htmlFor="brm-name"
                className="flex items-center gap-2 text-xs font-bold text-charcoal/50 uppercase tracking-wider mb-2"
              >
                <User className="w-3.5 h-3.5" />
                Name
              </label>
              <input
                id="brm-name"
                ref={nameRef}
                type="text"
                autoComplete="name"
                placeholder="Your full name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                onBlur={() => setForm((p) => ({ ...p, touchedName: true }))}
                className={`w-full px-4 py-3 bg-offwhite border rounded-xl text-charcoal placeholder:text-charcoal/25 text-sm focus:outline-none focus:ring-2 transition-all ${
                  form.touchedName && !nameOk
                    ? "border-red-400 focus:ring-red-200"
                    : "border-charcoal/10 focus:ring-gold/40"
                }`}
              />
              {form.touchedName && !nameOk && (
                <p className="mt-1 text-xs text-red-500">
                  Please enter your name (at least 2 characters)
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="brm-phone"
                className="flex items-center gap-2 text-xs font-bold text-charcoal/50 uppercase tracking-wider mb-2"
              >
                <Phone className="w-3.5 h-3.5" />
                Phone
              </label>
              <input
                id="brm-phone"
                type="tel"
                autoComplete="tel"
                placeholder="+971 50 000 0000"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                onBlur={() => setForm((p) => ({ ...p, touchedPhone: true }))}
                className={`w-full px-4 py-3 bg-offwhite border rounded-xl text-charcoal placeholder:text-charcoal/25 text-sm focus:outline-none focus:ring-2 transition-all ${
                  form.touchedPhone && !phoneOk
                    ? "border-red-400 focus:ring-red-200"
                    : "border-charcoal/10 focus:ring-gold/40"
                }`}
              />
              {form.touchedPhone && !phoneOk && (
                <p className="mt-1 text-xs text-red-500">
                  Please enter a valid phone number
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              id="brm-send-btn"
              type="submit"
              disabled={!canSubmit}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 gold-gradient text-white rounded-2xl font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending…
                </>
              ) : (
                "Send request →"
              )}
            </button>

            <p className="text-center text-[10px] text-charcoal/30 uppercase tracking-wider">
              No payment required at this stage
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
