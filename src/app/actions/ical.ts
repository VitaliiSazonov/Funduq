"use server";

import { createClient } from "@/lib/supabase/server";
import {
  parseISO,
  eachDayOfInterval,
  format,
  isBefore,
} from "date-fns";
import { TZDate } from "@date-fns/tz";

// ─────────────────────────────────────────────────────────────
// Asia/Dubai timezone constant
// ─────────────────────────────────────────────────────────────
const TZ = "Asia/Dubai";

/**
 * Converts a Date to a "YYYY-MM-DD" string in Asia/Dubai timezone.
 */
function toDubaiDateStr(date: Date): string {
  const dubaiDate = new TZDate(date, TZ);
  return format(dubaiDate, "yyyy-MM-dd");
}

/**
 * Fetches and merges disabled dates for a property from:
 *   1. Internal Supabase bookings (pending + confirmed)
 *   2. External iCal calendar links (Airbnb, Booking.com, etc.)
 *
 * Returns ISO date strings ("YYYY-MM-DD") in Asia/Dubai timezone.
 */
export async function getDisabledDates(
  propertyId: string
): Promise<string[]> {
  const supabase = await createClient();
  const disabledSet = new Set<string>();

  const todayDubai = new TZDate(new Date(), TZ);
  const todayStr = format(todayDubai, "yyyy-MM-dd");

  // ─── 1. Internal blocked dates (pending + confirmed bookings) ───
  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("check_in, check_out")
    .eq("property_id", propertyId)
    .eq("status", "confirmed");

  if (bookingsError) {
    console.error("Error fetching bookings:", bookingsError);
  }

  if (bookings) {
    for (const booking of bookings) {
      const start = parseISO(booking.check_in);
      const end = parseISO(booking.check_out);

      const days = eachDayOfInterval({ start, end });
      for (const day of days) {
        const dayStr = toDubaiDateStr(day);
        if (!isBefore(parseISO(dayStr), parseISO(todayStr))) {
          disabledSet.add(dayStr);
        }
      }
    }
  }

  // ─── 2. External iCal blocks from blocked_dates ───
  const { data: blockedDates, error: blockedDatesError } = await supabase
    .from("blocked_dates")
    .select("start_date, end_date")
    .eq("property_id", propertyId);

  if (blockedDatesError) {
    console.error("Error fetching blocked dates:", blockedDatesError);
  }

  if (blockedDates) {
    for (const block of blockedDates) {
      const start = parseISO(block.start_date);
      const end = parseISO(block.end_date);

      const days = eachDayOfInterval({ start, end });
      for (const day of days) {
        const dayStr = toDubaiDateStr(day);
        if (!isBefore(parseISO(dayStr), parseISO(todayStr))) {
          disabledSet.add(dayStr);
        }
      }
    }
  }

  return Array.from(disabledSet).sort();
}

/**
 * Deletes a calendar feed and removes all upcoming blocked dates that came from this feed source.
 */
export async function deleteCalendarFeed(
  feedId: string,
  propertyId: string,
  sourceName: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // ─── 1. Verify user owns the property (security check handled by RLS implicitly, but double safety) ───
  const { data: property } = await supabase
    .from("properties")
    .select("owner_id")
    .eq("id", propertyId)
    .single();

  if (!property || property.owner_id !== user.id) {
    throw new Error("Unauthorized: You don't own this property");
  }

  // ─── 2. Delete the feed record ───
  const { error: deleteFeedError } = await supabase
    .from("calendar_feeds")
    .delete()
    .eq("id", feedId);

  if (deleteFeedError) {
    throw deleteFeedError;
  }

  // ─── 3. Delete associated blocked dates ───
  // We only delete FUTURE events to maintain history of past blocks if needed, 
  // or delete all for complete cleanup? Usually better to delete all for this source to keep UI clean.
  const { error: deleteBlocksError } = await supabase
    .from("blocked_dates")
    .delete()
    .eq("property_id", propertyId)
    .eq("source", sourceName.toLowerCase());

  if (deleteBlocksError) {
    console.error("Partial deletion: feed removed, but blocked dates failed to delete.", deleteBlocksError);
  }

  return { success: true };
}
