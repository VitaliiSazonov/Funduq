"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type {
  BookingWithProperty,
  BookingWithGuest,
  OwnerContact,
} from "@/lib/types/booking";
import { sendEmail } from "@/lib/email/sendEmail";
import BookingConfirmedEmail from "@/lib/email/templates/BookingConfirmedEmail";
import BookingDeclinedEmail from "@/lib/email/templates/BookingDeclinedEmail";
import BookingRequestEmail from "@/lib/email/templates/BookingRequestEmail";

type ActionResult = {
  success: boolean;
  error?: string;
  bookingId?: string;
};

// ─────────────────────────────────────────────────────────────
// Public Guest Action — No auth required
// ─────────────────────────────────────────────────────────────

/**
 * Creates a new booking request from any visitor (authenticated or not).
 * Validates dates against existing blocked dates and confirmed bookings.
 * Returns { success, bookingId } on success.
 */
export async function createBookingRequest(params: {
  property_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  check_in: string;
  check_out: string;
  total_guests: number;
  message?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    property_id,
    guest_name,
    guest_email,
    guest_phone,
    check_in,
    check_out,
    total_guests,
    message,
  } = params;

  // ── 1. Server-side date validation ──
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkInDate = new Date(check_in);
  const checkOutDate = new Date(check_out);

  if (checkInDate < today) {
    return { success: false, error: "Check-in date cannot be in the past." };
  }
  if (checkOutDate <= checkInDate) {
    return { success: false, error: "Check-out must be after check-in." };
  }

  // ── 2. Check for conflicts in existing bookings ──
  const { data: conflictingBookings, error: conflictError } = await supabase
    .from("bookings")
    .select("id")
    .eq("property_id", property_id)
    .in("status", ["pending", "confirmed"])
    .or(`and(check_in.lt.${check_out},check_out.gt.${check_in})`);

  if (conflictError) {
    console.error("Error checking booking conflicts:", conflictError);
    return { success: false, error: "Could not verify availability. Please try again." };
  }

  if (conflictingBookings && conflictingBookings.length > 0) {
    return { success: false, error: "These dates are already taken. Please choose different dates." };
  }

  // ── 3. Check for conflicts in blocked_dates ──
  const { data: blockedConflicts, error: blockedError } = await supabase
    .from("blocked_dates")
    .select("id")
    .eq("property_id", property_id)
    .or(`and(start_date.lt.${check_out},end_date.gt.${check_in})`);

  if (blockedError) {
    console.error("Error checking blocked dates:", blockedError);
    // Non-fatal — proceed but log
  }

  if (blockedConflicts && blockedConflicts.length > 0) {
    return { success: false, error: "These dates are blocked. Please choose different dates." };
  }

  // ── 4. Get the current user (may be null for anonymous) ──
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── 5. Insert the booking ──
  const adminSupabase = createAdminClient();
  const { data: booking, error: insertError } = await adminSupabase
    .from("bookings")
    .insert({
      property_id,
      guest_id: user?.id ?? null,
      guest_name,
      guest_email,
      guest_phone: guest_phone ?? null,
      check_in,
      check_out,
      total_guests,
      message: message ?? null,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("Error creating booking:", insertError);
    return { success: false, error: "Could not create booking. Please try again." };
  }

  // ── 6. Notify host via email (fire-and-forget) ──
  const { data: property } = await supabase
    .from("properties")
    .select("title, owner_id, location_emirate, location_district")
    .eq("id", property_id)
    .single();

  if (property) {
    const { data: hostProfile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", property.owner_id)
      .single();

    if (hostProfile?.email) {
      const nights = calcNights(check_in, check_out);
      void sendEmail({
        to: hostProfile.email,
        subject: `New booking request for ${property.title}`,
        react: BookingRequestEmail({
          guestName: guest_name,
          propertyTitle: property.title,
          checkIn: formatDateDubai(check_in),
          checkOut: formatDateDubai(check_out),
          totalGuests: total_guests,
          totalNights: nights,
          estimatedPrice: "Contact host for pricing",
          baseUrl: BASE_URL,
        }),
      });
    }
  }

  revalidatePath("/host/bookings");
  return { success: true, bookingId: booking.id };
}



// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/** Format ISO date → "Mon, 14 Apr 2026" in Dubai timezone */
function formatDateDubai(iso: string): string {
  return new Date(iso + "T00:00:00+04:00").toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Dubai",
  });
}

/** Calculate nights between two ISO date strings */
function calcNights(checkIn: string, checkOut: string): number {
  const msPerDay = 86_400_000;
  return Math.max(
    1,
    Math.round(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / msPerDay
    )
  );
}

// ─────────────────────────────────────────────────────────────
// Guest Actions
// ─────────────────────────────────────────────────────────────

/**
 * Fetch all bookings for the current guest, with property details.
 */
export async function getGuestBookings(): Promise<BookingWithProperty[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
      *,
      property:properties!bookings_property_id_fkey (
        id, title, location_emirate, location_district, main_image_url, type
      )
    `
    )
    .eq("guest_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching guest bookings:", error);
    return [];
  }

  return (data || []) as unknown as BookingWithProperty[];
}

/**
 * Fetch owner contact info for a confirmed booking.
 * Only works if the booking belongs to the requesting guest AND status is "confirmed".
 */
export async function getOwnerContact(
  bookingId: string
): Promise<OwnerContact | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Verify the booking belongs to this guest and is confirmed
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("property_id, status")
    .eq("id", bookingId)
    .eq("guest_id", user.id)
    .single();

  if (bookingError || !booking || booking.status !== "confirmed") {
    return null;
  }

  // Get the property owner
  const { data: property } = await supabase
    .from("properties")
    .select("owner_id")
    .eq("id", booking.property_id)
    .single();

  if (!property) return null;

  // Get owner profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, phone, whatsapp")
    .eq("id", property.owner_id)
    .single();

  // Also get the auth user email as fallback
  const { data: ownerAuth } = await supabase.auth.admin.getUserById(
    property.owner_id
  );

  return {
    full_name: profile?.full_name || null,
    email: profile?.email || ownerAuth?.user?.email || null,
    phone: profile?.phone || null,
    whatsapp: profile?.whatsapp || null,
  };
}

// ─────────────────────────────────────────────────────────────
// Host Actions
// ─────────────────────────────────────────────────────────────

/**
 * Fetch all bookings for properties owned by the current host.
 */
export async function getHostBookings(): Promise<BookingWithGuest[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Get all property IDs owned by this host
  const { data: properties } = await supabase
    .from("properties")
    .select("id")
    .eq("owner_id", user.id);

  if (!properties || properties.length === 0) return [];

  const propertyIds = properties.map((p) => p.id);

  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
      *,
      property:properties!bookings_property_id_fkey ( id, title )
    `
    )
    .in("property_id", propertyIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching host bookings:", error);
    return [];
  }

  // Fetch guest emails separately for authenticated guests
  // Anonymous bookings have guest_id = null, but guest_email in the row
  const guestIds = [...new Set((data || [])
    .map((b) => b.guest_id)
    .filter((id): id is string => !!id)
  )];
  const guestProfileMap: Record<string, { email: string; name: string }> = {};

  for (const guestId of guestIds) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", guestId)
      .single();

    if (profile?.email) {
      guestProfileMap[guestId] = {
        email: profile.email,
        name: profile.full_name || "Guest",
      };
    }
  }

  return (data || []).map((booking) => ({
    ...booking,
    guest: {
      // Prefer profile data for authenticated guests, fall back to row data for anonymous
      email: (booking.guest_id && guestProfileMap[booking.guest_id]?.email)
        || booking.guest_email
        || "—",
      name: (booking.guest_id && guestProfileMap[booking.guest_id]?.name)
        || booking.guest_name
        || "Guest",
      phone: booking.guest_phone || null,
    },
    property: booking.property,
  })) as unknown as BookingWithGuest[];
}

/**
 * Host approves a booking → status = "confirmed" + blocks dates
 */
export async function approveBooking(
  bookingId: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated." };

  // RLS ensures only the property owner can update
  const { error } = await supabase
    .from("bookings")
    .update({ status: "confirmed", updated_at: new Date().toISOString() })
    .eq("id", bookingId);

  if (error) {
    console.error("Error approving booking:", error);
    return { success: false, error: "Failed to approve booking." };
  }

  // ── Fetch full booking details for downstream steps ──
  const { data: booking } = await supabase
    .from("bookings")
    .select("guest_id, guest_name, guest_email, check_in, check_out, property_id")
    .eq("id", bookingId)
    .single();

  if (booking) {
    // ── Block dates in blocked_dates (iCal availability sync) ──
    const { error: blockError } = await supabase
      .from("blocked_dates")
      .upsert(
        {
          property_id: booking.property_id,
          start_date: booking.check_in,
          end_date: booking.check_out,
          source: "funduq",
          external_uid: `funduq-booking-${bookingId}`,
          summary: `Funduq Booking #${bookingId.slice(0, 8)}`,
        },
        { onConflict: "property_id,external_uid" }
      );

    if (blockError) {
      console.error("Warning: could not write to blocked_dates:", blockError);
      // Non-fatal — booking is still confirmed
    }

    const { data: property } = await supabase
      .from("properties")
      .select("title, location_emirate, location_district")
      .eq("id", booking.property_id)
      .single();

    if (property) {
      // Email authenticated guest (via profile)
      let guestEmail: string | null = booking.guest_email ?? null;
      let guestName: string = booking.guest_name ?? "Guest";

      if (booking.guest_id) {
        const { data: guestProfile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", booking.guest_id)
          .single();
        if (guestProfile?.email) guestEmail = guestProfile.email;
        if (guestProfile?.full_name) guestName = guestProfile.full_name;
      }

      if (guestEmail) {
        void sendEmail({
          to: guestEmail,
          subject: `Your stay at ${property.title} is confirmed ✓`,
          react: BookingConfirmedEmail({
            guestName,
            propertyTitle: property.title,
            locationEmirate: property.location_emirate,
            locationDistrict: property.location_district,
            checkIn: formatDateDubai(booking.check_in),
            checkOut: formatDateDubai(booking.check_out),
            baseUrl: BASE_URL,
          }),
        });
      }
    }
  }

  revalidatePath("/host/bookings");
  revalidatePath("/guest/bookings");
  return { success: true };
}

/**
 * Host declines a booking → status = "declined"
 */
export async function declineBooking(
  bookingId: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated." };

  const { error } = await supabase
    .from("bookings")
    .update({ status: "declined", updated_at: new Date().toISOString() })
    .eq("id", bookingId);

  if (error) {
    console.error("Error declining booking:", error);
    return { success: false, error: "Failed to decline booking." };
  }

  // ── Email: notify GUEST about decline (fire-and-forget) ──
  const { data: booking } = await supabase
    .from("bookings")
    .select("guest_id, check_in, check_out, property_id")
    .eq("id", bookingId)
    .single();

  if (booking) {
    const { data: property } = await supabase
      .from("properties")
      .select("title")
      .eq("id", booking.property_id)
      .single();

    const { data: guestProfile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", booking.guest_id)
      .single();

    if (guestProfile?.email && property) {
      void sendEmail({
        to: guestProfile.email,
        subject: `Update on your booking request`,
        react: BookingDeclinedEmail({
          guestName: guestProfile.full_name || "Guest",
          propertyTitle: property.title,
          checkIn: formatDateDubai(booking.check_in),
          checkOut: formatDateDubai(booking.check_out),
          baseUrl: BASE_URL,
        }),
      });
    }
  }

  revalidatePath("/host/bookings");
  revalidatePath("/guest/bookings");
  return { success: true };
}
