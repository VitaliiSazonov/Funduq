"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { approveBooking, declineBooking } from "@/app/actions/bookings";
import { Check, X, Loader2 } from "lucide-react";

interface BookingActionsProps {
  bookingId: string;
}

export default function BookingActions({ bookingId }: BookingActionsProps) {
  const t = useTranslations("host");
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "decline" | null>(null);

  async function handleApprove() {
    setLoading("approve");
    const res = await approveBooking(bookingId);
    if (res.success) {
      router.refresh();
    }
    setLoading(null);
  }

  async function handleDecline() {
    setLoading("decline");
    const res = await declineBooking(bookingId);
    if (res.success) {
      router.refresh();
    }
    setLoading(null);
  }

  return (
    <div className="flex items-center gap-3 shrink-0">
      <button
        onClick={handleApprove}
        disabled={loading !== null}
        data-testid="booking-approve"
        className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 cursor-pointer"
      >
        {loading === "approve" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Check className="w-4 h-4" />
        )}
        {t("approve")}
      </button>
      <button
        onClick={handleDecline}
        disabled={loading !== null}
        data-testid="booking-decline"
        className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-red-50 border border-red-200 text-red-600 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 cursor-pointer"
      >
        {loading === "decline" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <X className="w-4 h-4" />
        )}
        {t("decline")}
      </button>
    </div>
  );
}
