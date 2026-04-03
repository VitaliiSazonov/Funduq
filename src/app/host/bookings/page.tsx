import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getHostBookings } from "@/app/actions/bookings";
import { getHostLocale, getHostMessages } from "@/lib/getHostLocale";
import BookingActions from "./BookingActions";
import {
  CalendarDays,
  ArrowLeft,
  Inbox,
} from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending:   "bg-amber-100 text-amber-700",
    confirmed: "bg-green-100 text-green-700",
    declined:  "bg-red-100 text-red-600",
    cancelled: "bg-gray-100 text-gray-500",
  };
  return map[status] || "bg-gray-100 text-gray-500";
}

export default async function HostBookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const bookings = await getHostBookings();

  // ── Load translations ──
  const locale = await getHostLocale();
  const messages = await getHostMessages(locale);
  const h = messages.host;

  return (
    <div className="min-h-screen bg-offwhite py-32 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-12">
          <Link
            href="/host/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-charcoal/40 hover:text-charcoal transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {h.backToDashboard}
          </Link>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <span className="text-sm font-black text-gold uppercase tracking-[0.2em] display-font">
                {h.manage}
              </span>
              <h1 className="text-4xl md:text-5xl font-black text-charcoal display-font tracking-tight">
                {h.incomingBookings}
              </h1>
              <p className="text-charcoal/40 font-medium mt-2">
                {h.bookingsSubtitle}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-charcoal/50 bg-white px-4 py-2 rounded-full border border-charcoal/5">
              <CalendarDays className="w-4 h-4 text-gold" />
              {bookings.length} {bookings.length !== 1 ? h.requests : h.request}
            </div>
          </div>
        </header>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="w-20 h-20 bg-offwhite rounded-full flex items-center justify-center mx-auto mb-6">
              <Inbox className="w-8 h-8 text-charcoal/20" />
            </div>
            <h3 className="text-xl font-bold text-charcoal mb-2">
              {h.noBookingsTitle}
            </h3>
            <p className="text-charcoal/40 max-w-xs mx-auto">
              {h.noBookingsDesc}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-2xl border border-charcoal/5 p-6 hover:shadow-luxury transition-shadow duration-300"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg font-bold text-charcoal display-font">
                        {booking.property.title}
                      </h3>
                      <span
                        data-testid="booking-status"
                        className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${statusBadge(
                          booking.status
                        )}`}
                      >
                        {booking.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-charcoal/50">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5 text-gold" />
                        {format(parseISO(booking.check_in), "MMM d")} →{" "}
                        {format(parseISO(booking.check_out), "MMM d, yyyy")}
                      </span>
                      <span>
                        {booking.total_guests} {booking.total_guests !== 1 ? h.guestPlural : h.guest}
                      </span>
                      <span>{h.guestLabel}: {booking.guest.email}</span>
                    </div>

                    {booking.message && (
                      <p className="text-sm text-charcoal/40 italic mt-1 border-l-2 border-gold/20 pl-3">
                        &ldquo;{booking.message}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Right: Actions */}
                  {booking.status === "pending" && (
                    <BookingActions bookingId={booking.id} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
