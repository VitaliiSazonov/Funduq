"use client";

import { useState, useEffect } from "react";
import { getOwnerContact } from "@/app/actions/bookings";
import type { OwnerContact } from "@/lib/types/booking";
import { useTranslations } from "next-intl";
import {
  Phone,
  Mail,
  MessageCircle,
  Lock,
  Loader2,
  User,
} from "lucide-react";

interface ContactRevealProps {
  bookingId: string;
  status: string;
}

export default function ContactReveal({
  bookingId,
  status,
}: ContactRevealProps) {
  const t = useTranslations("contactReveal");
  const [contact, setContact] = useState<OwnerContact | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (status !== "confirmed" || fetched) return;

    async function fetchContact() {
      setLoading(true);
      const data = await getOwnerContact(bookingId);
      setContact(data);
      setFetched(true);
      setLoading(false);
    }

    fetchContact();
  }, [bookingId, status, fetched]);

  // ─── Not confirmed: show placeholder ───
  if (status !== "confirmed") {
    return (
      <div className="flex items-center gap-3 mt-3 px-4 py-3 bg-offwhite rounded-xl border border-charcoal/5">
        <Lock className="w-4 h-4 text-charcoal/20 shrink-0" />
        <p className="text-sm text-charcoal/40">
          {t("contactAfterConfirm")}
        </p>
      </div>
    );
  }

  // ─── Loading state ───
  if (loading) {
    return (
      <div className="flex items-center gap-3 mt-3 px-4 py-3 bg-gold/5 rounded-xl border border-gold/10">
        <Loader2 className="w-4 h-4 text-gold animate-spin shrink-0" />
        <p className="text-sm text-charcoal/50">{t("loadingContact")}</p>
      </div>
    );
  }

  // ─── Confirmed: show contacts ───
  if (!contact) {
    return (
      <div className="flex items-center gap-3 mt-3 px-4 py-3 bg-offwhite rounded-xl border border-charcoal/5">
        <User className="w-4 h-4 text-charcoal/20 shrink-0" />
        <p className="text-sm text-charcoal/40">
          {t("contactNotAvailable")}
        </p>
      </div>
    );
  }

  const whatsappNumber = contact.whatsapp || contact.phone;

  return (
    <div data-testid="contact-reveal" className="mt-3 px-5 py-4 bg-green-50/50 border border-green-200/60 rounded-xl space-y-3">
      <p className="text-[10px] font-black text-green-600 uppercase tracking-[0.15em]">
        ✓ {t("bookingConfirmed")}
      </p>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {contact.full_name && (
          <span className="flex items-center gap-2 text-sm font-semibold text-charcoal">
            <User className="w-4 h-4 text-gold" />
            {contact.full_name}
          </span>
        )}

        {contact.phone && (
          <a
            href={`tel:${contact.phone}`}
            data-testid="contact-phone"
            className="flex items-center gap-2 text-sm text-charcoal/70 hover:text-gold transition-colors"
          >
            <Phone className="w-4 h-4 text-gold" />
            {contact.phone}
          </a>
        )}

        {contact.email && (
          <a
            href={`mailto:${contact.email}`}
            data-testid="contact-email"
            className="flex items-center gap-2 text-sm text-charcoal/70 hover:text-gold transition-colors"
          >
            <Mail className="w-4 h-4 text-gold" />
            {contact.email}
          </a>
        )}
      </div>

      {whatsappNumber && (
        <a
          href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="contact-whatsapp"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          {t("messageOnWhatsApp")}
        </a>
      )}
    </div>
  );
}
