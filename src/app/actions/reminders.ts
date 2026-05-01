"use server";

import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/sendEmail";
import BookingReminderEmail from "@/lib/email/templates/BookingReminderEmail";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const REMINDER_THRESHOLD_HOURS = 12; // Send reminder if older than 12h

/**
 * Scans for pending bookings older than the threshold and sends a reminder email to hosts.
 * Designed to be called by a cron job.
 */
export async function sendBookingReminders() {
  const supabase = await createClient();

  // 1. Find pending bookings older than threshold that haven't received a reminder yet
  const thresholdDate = new Date();
  thresholdDate.setHours(thresholdDate.getHours() - REMINDER_THRESHOLD_HOURS);

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(`
      id,
      property_id,
      properties!bookings_property_id_fkey (
        owner_id,
        title
      )
    `)
    .eq("status", "pending")
    .lt("created_at", thresholdDate.toISOString())
    .is("last_reminder_sent_at", null);

  if (error) {
    console.error("[Reminders] Error fetching bookings:", error);
    return { success: false, error };
  }

  if (!bookings || bookings.length === 0) {
    return { success: true, sent: 0 };
  }

  // 2. Group bookings by host to send a single consolidated email
  const hostMap = new Map<string, { email: string; name: string; bookingIds: string[] }>();

  for (const b of bookings) {
    // b.properties is returned as an object (not array) because of the relation
    const property = b.properties as any;
    const ownerId = property?.owner_id;
    if (!ownerId) continue;

    if (!hostMap.has(ownerId)) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", ownerId)
        .single();
      
      if (profile?.email) {
        hostMap.set(ownerId, { 
          email: profile.email, 
          name: profile.full_name || "Host", 
          bookingIds: [b.id] 
        });
      }
    } else {
      hostMap.get(ownerId)?.bookingIds.push(b.id);
    }
  }

  // 3. Send emails to each host
  let sentCount = 0;
  for (const [hostId, data] of hostMap.entries()) {
    try {
      await sendEmail({
        to: data.email,
        subject: `Action Required: Pending Booking Requests on Funduq`,
        react: BookingReminderEmail({
          hostName: data.name,
          pendingCount: data.bookingIds.length,
          baseUrl: BASE_URL,
        }),
      });

      // Update bookings to record that the reminder was sent
      const { error: updateError } = await supabase
        .from("bookings")
        .update({ last_reminder_sent_at: new Date().toISOString() })
        .in("id", data.bookingIds);

      if (updateError) {
        console.error(`[Reminders] Failed to update bookings for host ${hostId}:`, updateError);
      } else {
        sentCount++;
      }
    } catch (err) {
      console.error(`[Reminders] Failed to send email to ${data.email}:`, err);
    }
  }

  return { success: true, sent: sentCount };
}
