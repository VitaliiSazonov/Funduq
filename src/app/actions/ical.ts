"use server";

import { createClient } from "@/lib/supabase/server";
import ical, { VEvent } from "node-ical";
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
 * Type guard to narrow a CalendarComponent to a VEvent.
 */
function isVEvent(component: ical.CalendarComponent): component is VEvent {
  return component.type === "VEVENT";
}

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
    .in("status", ["pending", "confirmed"]);

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

  // ─── 2. External iCal calendar links ───
  const { data: icalLinks, error: icalError } = await supabase
    .from("ical_links")
    .select("url")
    .eq("property_id", propertyId);

  if (icalError) {
    console.error("Error fetching iCal links:", icalError);
  }

  if (icalLinks) {
    const icalPromises = icalLinks.map(async (link) => {
      try {
        const events = await ical.async.fromURL(link.url);

        for (const key of Object.keys(events)) {
          const component = events[key];
          if (!component || !isVEvent(component)) continue;

          const start = component.start;
          const end = component.end;
          if (!start || !end) continue;

          const days = eachDayOfInterval({
            start: new Date(start.getTime()),
            end: new Date(end.getTime()),
          });

          for (const day of days) {
            const dayStr = toDubaiDateStr(day);
            if (!isBefore(parseISO(dayStr), parseISO(todayStr))) {
              disabledSet.add(dayStr);
            }
          }
        }
      } catch (err) {
        console.error(`Failed to fetch iCal from ${link.url}:`, err);
        // Don't fail the whole request — just skip this calendar
      }
    });

    await Promise.all(icalPromises);
  }

  return Array.from(disabledSet).sort();
}
