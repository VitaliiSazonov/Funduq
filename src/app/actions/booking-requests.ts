"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── Shared result type ────────────────────────────────────────────────────────
export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string; code?: string };

// ─── 1. createBookingRequest ───────────────────────────────────────────────────
// PUBLIC action — called from BookingRequestModal without login.
// Uses service_role (bypasses RLS) because there is no INSERT policy.
// The trigger set_host_id overwrites host_id from properties.owner_id automatically.
// Always returns success: true on INSERT success so the caller can open WhatsApp.

const createSchema = z.object({
  property_id: z.string().uuid(),
  guest_name: z.string().trim().min(1).max(120),
  guest_phone: z
    .string()
    .trim()
    .min(7)
    .max(20)
    .regex(/^[+\d\s()-]+$/),
  check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  total_guests: z.number().int().min(1).max(50).optional().default(1),
  message: z.string().max(2000).optional(),
});

export async function createBookingRequest(
  input: z.input<typeof createSchema>
): Promise<ActionResult<{ id: string }>> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input", code: "VALIDATION" };
  }

  // createAdminClient is synchronous (no await needed)
  const admin = createAdminClient();

  // Try to get the current user to link the request to their account
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await admin
    .from("booking_requests")
    .insert({
      property_id: parsed.data.property_id,
      // Placeholder — the trigger set_host_id overwrites this with properties.owner_id
      host_id: "00000000-0000-0000-0000-000000000000",
      guest_id: user?.id ?? null,
      guest_name: parsed.data.guest_name,
      guest_phone: parsed.data.guest_phone,
      check_in: parsed.data.check_in,
      check_out: parsed.data.check_out,
      total_guests: parsed.data.total_guests,
      message: parsed.data.message ?? null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[createBookingRequest]", error);
    return { success: false, error: error.message, code: error.code };
  }

  // No revalidatePath — client redirects to WhatsApp; host/admin pages reload on next visit.
  return { success: true, data: { id: data.id } };
}

// ─── 2. updateBookingRequestStatus (host changes status) ──────────────────────
// RLS-aware: host can only see and update rows where host_id = auth.uid().

const statusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["Request", "OnProcess", "Confirmed", "Checkout", "Cancel"]),
});

export async function updateBookingRequestStatus(
  input: z.input<typeof statusSchema>
): Promise<ActionResult> {
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input", code: "VALIDATION" };
  }

  // createClient is async
  const supabase = await createClient();

  const { error } = await supabase
    .from("booking_requests")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id);

  if (error) {
    console.error("[updateBookingRequestStatus]", error);
    return { success: false, error: error.message, code: error.code };
  }

  return { success: true };
}

// ─── 3. setHostReply (3-button reply) ─────────────────────────────────────────
// RLS-aware: host can only update their own rows.

const replySchema = z.object({
  id: z.string().uuid(),
  host_reply: z.enum(["done", "reject", "contact_me"]),
});

export async function setHostReply(
  input: z.input<typeof replySchema>
): Promise<ActionResult> {
  const parsed = replySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input", code: "VALIDATION" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("booking_requests")
    .update({ host_reply: parsed.data.host_reply })
    .eq("id", parsed.data.id);

  if (error) {
    console.error("[setHostReply]", error);
    return { success: false, error: error.message, code: error.code };
  }

  return { success: true };
}

// ─── 4. setAdminComment (admin only) ──────────────────────────────────────────
// Extra role check before the DB call — fast fail instead of waiting for RLS.
// RLS also enforces admin-only access as a second layer.

const commentSchema = z.object({
  id: z.string().uuid(),
  admin_comment: z.string().trim().max(500),
});

export async function setAdminComment(
  input: z.input<typeof commentSchema>
): Promise<ActionResult> {
  const parsed = commentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input", code: "VALIDATION" };
  }

  const supabase = await createClient();

  // Verify caller is authenticated
  const { data: userResult, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userResult?.user) {
    return { success: false, error: "Unauthorized", code: "AUTH" };
  }

  // Verify caller has admin role (fast fail; RLS is a second layer)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userResult.user.id)
    .single();

  if (profile?.role !== "admin") {
    return { success: false, error: "Forbidden", code: "FORBIDDEN" };
  }

  const { error } = await supabase
    .from("booking_requests")
    .update({ admin_comment: parsed.data.admin_comment })
    .eq("id", parsed.data.id);

  if (error) {
    console.error("[setAdminComment]", error);
    return { success: false, error: error.message, code: error.code };
  }

  return { success: true };
}

// ─── 5. getGuestBookingRequests ───────────────────────────────────────────────
// Fetch all booking_requests for the currently authenticated guest.

export interface GuestBookingRequest {
  id: string;
  property_id: string;
  guest_name: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  total_guests: number;
  message: string | null;
  status: string;
  host_reply: string | null;
  created_at: string;
  updated_at: string;
  property: {
    id: string;
    title: string;
    location_emirate: string;
    location_district: string;
    main_image_url: string | null;
    type: string;
  };
}

export async function getGuestBookingRequests(): Promise<GuestBookingRequest[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("booking_requests")
    .select(
      `
      id, property_id, guest_name, guest_phone,
      check_in, check_out, total_guests, message,
      status, host_reply, created_at, updated_at,
      property:properties!booking_requests_property_id_fkey (
        id, title, location_emirate, location_district, main_image_url, type
      )
    `
    )
    .eq("guest_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getGuestBookingRequests]", error);
    return [];
  }

  return (data || []) as unknown as GuestBookingRequest[];
}
