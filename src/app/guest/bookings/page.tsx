import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGuestBookingRequests } from "@/app/actions/booking-requests";
import { getHostLocale, getHostMessages } from "@/lib/getHostLocale";
import {
  CalendarDays,
  ArrowLeft,
  Luggage,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  Loader,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { format, parseISO, isPast } from "date-fns";

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

  // Split into upcoming vs past
  const upcoming = bookings.filter(
    (b) =>
      !isPast(parseISO(b.check_out)) &&
      (b.status === "Request" || b.status === "OnProcess" || b.status === "Confirmed")
  );
  const past = bookings.filter(
    (b) =>
      isPast(parseISO(b.check_out)) ||
      b.status === "Cancel" ||
      b.status === "Checkout"
  );

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

          {/* ─── Upcoming ─── */}
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
                {upcoming.map((booking) => {
                  const sc = statusConfig(booking.status);
                  return (
                    <div
                      key={booking.id}
                      className="bg-white rounded-2xl border border-charcoal/5 overflow-hidden hover:shadow-luxury transition-shadow duration-300"
                    >
                      <div className="flex flex-col md:flex-row">
                        {/* Image */}
                        <div className="relative w-full md:w-56 h-44 md:h-auto shrink-0">
                          <Image
                            src={
                              booking.property.main_image_url ||
                              "/images/props/placeholder.png"
                            }
                            alt={booking.property.title}
                            fill
                            className="object-cover"
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 p-6 space-y-3">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-xl font-bold text-charcoal display-font">
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
                              {booking.total_guests} {booking.total_guests !== 1 ? t.guests : t.guest}
                            </span>
                          </div>

                          {booking.message && (
                            <p className="text-sm text-charcoal/40 italic border-l-2 border-gold/20 pl-3">
                              &ldquo;{booking.message}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ─── Past / Cancelled ─── */}
          {past.length > 0 && (
            <section>
              <h2 className="text-xs font-black text-charcoal/30 uppercase tracking-[0.2em] mb-6">
                {t.pastAndCancelled} ({past.length})
              </h2>
              <div className="space-y-3">
                {past.map((booking) => {
                  const sc = statusConfig(booking.status);
                  return (
                    <div
                      key={booking.id}
                      className="bg-white/60 rounded-2xl border border-charcoal/5 p-5 flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-charcoal/70">
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
                          {booking.total_guests} {booking.total_guests !== 1 ? t.guests : t.guest}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
  );
}
