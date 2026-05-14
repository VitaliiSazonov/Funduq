"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import BookingWidget from "./BookingWidget";

interface MobileBookingWidgetProps {
  propertyId: string;
  priceMin: number;
  priceMax: number;
  maxGuests: number;
  propertyTitle: string;
}

export default function MobileBookingWidget({
  propertyId,
  priceMin,
  priceMax,
  maxGuests,
  propertyTitle,
}: MobileBookingWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("bookingWidget");

  // Prevent body scroll when the bottom sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* ─── Sticky Bottom Bar ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-charcoal/5 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] px-4 py-3 flex items-center justify-between lg:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div>
          <p className="text-[10px] text-charcoal/40 font-bold uppercase tracking-wider leading-none mb-1">
            {t("from")}
          </p>
          <p className="text-lg font-black text-charcoal display-font leading-none">
            AED {new Intl.NumberFormat().format(priceMin)}
            <span className="text-charcoal/40 text-sm font-normal"> {t("perNight")}</span>
          </p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="px-5 py-3 gold-gradient text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity shadow-sm"
        >
          {t("requestToBook")}
        </button>
      </div>

      {/* ─── Bottom Sheet Backdrop ─── */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-[2px] z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* ─── Bottom Sheet (Floating Slide-Up Card) ─── */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] transition-all duration-300 ease-out max-w-md mx-auto pointer-events-none ${
          isOpen ? "translate-y-0 opacity-100 pointer-events-auto" : "translate-y-full opacity-0"
        }`}
      >
        <div className="relative w-full shadow-luxury rounded-3xl overflow-hidden">
          {/* Floating Close Button absolutely positioned over the header's empty right area */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-3.5 right-3.5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-20 focus:outline-none focus:ring-2 focus:ring-white/20 pointer-events-auto"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="pointer-events-auto">
            <BookingWidget
              propertyId={propertyId}
              priceMin={priceMin}
              priceMax={priceMax}
              maxGuests={maxGuests}
              propertyTitle={propertyTitle}
            />
          </div>
        </div>
      </div>
    </>
  );
}
