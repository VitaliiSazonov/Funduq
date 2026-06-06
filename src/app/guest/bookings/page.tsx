import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGuestBookingRequests } from "@/app/actions/booking-requests";
import { getHostLocale, getHostMessages } from "@/lib/getHostLocale";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import GuestBookingsClient from "./GuestBookingsClient";

export const metadata = {
  title: "My Bookings | Funduq",
  description:
    "View your past and upcoming luxury stays across the UAE.",
};

export default async function GuestBookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const bookings = await getGuestBookingRequests();

  // ── Load translations ──
  const locale = await getHostLocale();
  const messages = await getHostMessages(locale);
  const t = messages.guestBookings;

  return (
      <div className="min-h-screen bg-offwhite pt-12 pb-32 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <header className="mb-12">
            <Link
              href="/villas"
              className="inline-flex items-center gap-2 text-sm font-semibold text-charcoal/40 hover:text-charcoal transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              {t.browseVillas}
            </Link>
            <span className="block text-sm font-black text-gold uppercase tracking-[0.2em] display-font">
              {t.yourStays}
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-charcoal display-font tracking-tight">
              {t.myBookings}
            </h1>
            <p className="text-charcoal/40 font-medium mt-2">
              {t.trackStays}
            </p>
          </header>

          <GuestBookingsClient bookings={bookings} t={t} />
        </div>
      </div>
  );
}
