"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  BookingWithProperty,
  BookingWithGuest,
  OwnerContact,
} from "@/lib/types/booking";
import { sendEmail } from "@/lib/email/sendEmail";
import BookingConfirmedEmail from "@/lib/email/templates/BookingConfirmedEmail";
import BookingDeclinedEmail from "@/lib/email/templates/BookingDeclinedEmail";

type ActionResult = {
  success: boolean;
  error?: string;
};

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

  // Fetch guest emails separately (can't join auth.users directly)
  const guestIds = [...new Set((data || []).map((b) => b.guest_id))];
  const guestEmailMap: Record<string, string> = {};

  for (const guestId of guestIds) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", guestId)
      .single();

    if (profile?.email) {
      guestEmailMap[guestId] = profile.email;
    }
  }

  return (data || []).map((booking) => ({
    ...booking,
    guest: {
      email: guestEmailMap[booking.guest_id] || "Guest",
    },
    property: booking.property,
  })) as unknown as BookingWithGuest[];
}

/**
 * Host approves a booking → status = "confirmed"
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

  // ── Email: notify GUEST about confirmation (fire-and-forget) ──
  const { data: booking } = await supabase
    .from("bookings")
    .select("guest_id, check_in, check_out, property_id")
    .eq("id", bookingId)
    .single();

  if (booking) {
    const { data: property } = await supabase
      .from("properties")
      .select("title, location_emirate, location_district")
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
        subject: `Your stay at ${property.title} is confirmed ✓`,
        react: BookingConfirmedEmail({
          guestName: guestProfile.full_name || "Guest",
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
