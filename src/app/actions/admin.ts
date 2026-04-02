"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/sendEmail";
import PropertyApprovedEmail from "@/lib/email/templates/PropertyApprovedEmail";
import PropertySuspendedEmail from "@/lib/email/templates/PropertySuspendedEmail";
import PassportApprovedEmail from "@/lib/email/templates/PassportApprovedEmail";
import PassportRejectedEmail from "@/lib/email/templates/PassportRejectedEmail";

// ─── Types ─────────────────────────────────────────────────────

export interface ActionResult {
  success: boolean;
  error?: string;
}

export interface AdminStats {
  activeListings: number;
  pendingReview: number;
  bookingsThisMonth: number;
  totalUsers: number;
}

export interface PropertyWithHost {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  location_emirate: string;
  location_district: string;
  main_image_url: string | null;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  price_min: number;
  price_max: number;
  created_at: string;
  is_signature: boolean;
  owner: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    email?: string;
  };
}

// ─── Helpers ───────────────────────────────────────────────────

async function verifyAdmin(): Promise<{
  isAdmin: boolean;
  userId?: string;
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { isAdmin: false, error: "Not authenticated" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { isAdmin: false, error: "Unauthorized" };
  }

  return { isAdmin: true, userId: user.id };
}

// ─── Actions ───────────────────────────────────────────────────

export async function approveProperty(
  propertyId: string
): Promise<ActionResult> {
  const auth = await verifyAdmin();
  if (!auth.isAdmin) return { success: false, error: auth.error };

  const supabase = await createClient();

  const { error } = await supabase
    .from("properties")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("id", propertyId);

  if (error) {
    console.error("[Admin] Failed to approve property:", error);
    return { success: false, error: "Failed to approve property" };
  }

  // Fire-and-forget email to property owner
  void (async () => {
    try {
      const { data: property } = await supabase
        .from("properties")
        .select("title, owner_id")
        .eq("id", propertyId)
        .single();

      if (!property) return;

      // Get owner email from auth.users via admin lookup
      // Since we're server-side, query profiles joined approach
      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", property.owner_id)
        .single();

      // Get email from auth — use supabase admin or RPC
      // For now, fetch the user's email via auth.admin if available
      const { data: userData } = await supabase.auth.admin.getUserById(
        property.owner_id
      );

      const ownerEmail = userData?.user?.email;
      if (!ownerEmail) return;

      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL || "https://funduq.com";

      await sendEmail({
        to: ownerEmail,
        subject: `🎉 Your listing is now live — ${property.title}`,
        react: PropertyApprovedEmail({
          hostName: ownerProfile?.full_name || "Host",
          propertyTitle: property.title,
          propertyId,
          baseUrl,
        }),
      });
    } catch (err) {
      console.error("[Admin] Email send failed (approve):", err);
    }
  })();

  return { success: true };
}

export async function suspendProperty(
  propertyId: string
): Promise<ActionResult> {
  const auth = await verifyAdmin();
  if (!auth.isAdmin) return { success: false, error: auth.error };

  const supabase = await createClient();

  const { error } = await supabase
    .from("properties")
    .update({ status: "suspended", updated_at: new Date().toISOString() })
    .eq("id", propertyId);

  if (error) {
    console.error("[Admin] Failed to suspend property:", error);
    return { success: false, error: "Failed to suspend property" };
  }

  // Fire-and-forget email to property owner
  void (async () => {
    try {
      const { data: property } = await supabase
        .from("properties")
        .select("title, owner_id")
        .eq("id", propertyId)
        .single();

      if (!property) return;

      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", property.owner_id)
        .single();

      const { data: userData } = await supabase.auth.admin.getUserById(
        property.owner_id
      );

      const ownerEmail = userData?.user?.email;
      if (!ownerEmail) return;

      await sendEmail({
        to: ownerEmail,
        subject: `Important update about your Funduq listing`,
        react: PropertySuspendedEmail({
          hostName: ownerProfile?.full_name || "Host",
          propertyTitle: property.title,
        }),
      });
    } catch (err) {
      console.error("[Admin] Email send failed (suspend):", err);
    }
  })();

  return { success: true };
}

export async function getAdminStats(): Promise<AdminStats> {
  const auth = await verifyAdmin();
  if (!auth.isAdmin) {
    return { activeListings: 0, pendingReview: 0, bookingsThisMonth: 0, totalUsers: 0 };
  }

  const supabase = await createClient();

  // Get first day of current month
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [activeRes, pendingRes, bookingsRes, usersRes] = await Promise.all([
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending_review"),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .gte("created_at", firstOfMonth),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true }),
  ]);

  return {
    activeListings: activeRes.count ?? 0,
    pendingReview: pendingRes.count ?? 0,
    bookingsThisMonth: bookingsRes.count ?? 0,
    totalUsers: usersRes.count ?? 0,
  };
}

export async function getPendingProperties(): Promise<PropertyWithHost[]> {
  const auth = await verifyAdmin();
  if (!auth.isAdmin) return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("properties")
    .select(
      `
      id, title, description, type, status, location_emirate, location_district,
      main_image_url, bedrooms, bathrooms, max_guests, price_min, price_max,
      created_at, is_signature,
      owner:profiles!properties_owner_id_fkey (
        id, full_name, avatar_url
      )
    `
    )
    .eq("status", "pending_review")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Admin] Failed to fetch pending properties:", error);
    return [];
  }

  return (data || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    title: row.title as string,
    description: row.description as string | null,
    type: row.type as string,
    status: row.status as string,
    location_emirate: row.location_emirate as string,
    location_district: row.location_district as string,
    main_image_url: row.main_image_url as string | null,
    bedrooms: row.bedrooms as number,
    bathrooms: row.bathrooms as number,
    max_guests: row.max_guests as number,
    price_min: row.price_min as number,
    price_max: row.price_max as number,
    created_at: row.created_at as string,
    is_signature: (row.is_signature as boolean) || false,
    owner: row.owner as { id: string; full_name: string | null; avatar_url: string | null },
  }));
}

export async function getAllAdminProperties(
  statusFilter?: string
): Promise<PropertyWithHost[]> {
  const auth = await verifyAdmin();
  if (!auth.isAdmin) return [];

  const supabase = await createClient();

  let query = supabase
    .from("properties")
    .select(
      `
      id, title, description, type, status, location_emirate, location_district,
      main_image_url, bedrooms, bathrooms, max_guests, price_min, price_max,
      created_at, is_signature,
      owner:profiles!properties_owner_id_fkey (
        id, full_name, avatar_url
      )
    `
    )
    .order("created_at", { ascending: false });

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[Admin] Failed to fetch admin properties:", error);
    return [];
  }

  return (data || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    title: row.title as string,
    description: row.description as string | null,
    type: row.type as string,
    status: row.status as string,
    location_emirate: row.location_emirate as string,
    location_district: row.location_district as string,
    main_image_url: row.main_image_url as string | null,
    bedrooms: row.bedrooms as number,
    bathrooms: row.bathrooms as number,
    max_guests: row.max_guests as number,
    price_min: row.price_min as number,
    price_max: row.price_max as number,
    created_at: row.created_at as string,
    is_signature: (row.is_signature as boolean) || false,
    owner: row.owner as { id: string; full_name: string | null; avatar_url: string | null },
  }));
}

// ─── Passport Verification ─────────────────────────────────────

export interface UserWithPassport {
  id: string;
  full_name: string | null;
  email: string | null;
  passport_url: string | null;
  passport_verified: boolean;
  passport_submitted_at: string | null;
}

/**
 * Admin: list users who have submitted a passport but are not yet verified.
 */
export async function getPendingPassports(): Promise<UserWithPassport[]> {
  const auth = await verifyAdmin();
  if (!auth.isAdmin) return [];

  const adminDb = createAdminClient();

  const { data, error } = await adminDb
    .from("profiles")
    .select("id, full_name, email, passport_url, passport_verified, passport_submitted_at")
    .not("passport_url", "is", null)
    .eq("passport_verified", false)
    .order("passport_submitted_at", { ascending: false });

  if (error) {
    console.error("[Admin] Failed to fetch pending passports:", error);
    return [];
  }

  return (data || []) as UserWithPassport[];
}

/**
 * Admin: approve a guest's passport verification.
 * Uses service-role client to bypass RLS.
 */
export async function verifyPassport(userId: string): Promise<ActionResult> {
  const auth = await verifyAdmin();
  if (!auth.isAdmin) return { success: false, error: auth.error };

  const adminDb = createAdminClient();

  const { error } = await adminDb
    .from("profiles")
    .update({ passport_verified: true })
    .eq("id", userId);

  if (error) {
    console.error("[Admin] Failed to verify passport:", error);
    return { success: false, error: "Failed to verify passport." };
  }

  // Fire-and-forget email to the guest
  void (async () => {
    try {
      const { data: profile } = await adminDb
        .from("profiles")
        .select("full_name, email")
        .eq("id", userId)
        .single();

      if (!profile?.email) return;

      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://funduq.com";

      await sendEmail({
        to: profile.email,
        subject: "✅ Your identity has been verified — Funduq",
        react: PassportApprovedEmail({
          guestName: profile.full_name || "Guest",
          baseUrl,
        }),
      });
    } catch (err) {
      console.error("[Admin] Email send failed (passport approve):", err);
    }
  })();

  return { success: true };
}

/**
 * Admin: reject a guest's passport submission.
 * Clears passport data so the guest can re-submit.
 * Uses service-role client to bypass RLS.
 */
export async function rejectPassport(
  userId: string,
  reason?: string
): Promise<ActionResult> {
  const auth = await verifyAdmin();
  if (!auth.isAdmin) return { success: false, error: auth.error };

  const adminDb = createAdminClient();

  const { error } = await adminDb
    .from("profiles")
    .update({
      passport_url: null,
      passport_submitted_at: null,
      passport_verified: false,
    })
    .eq("id", userId);

  if (error) {
    console.error("[Admin] Failed to reject passport:", error);
    return { success: false, error: "Failed to reject passport." };
  }

  // Fire-and-forget email to the guest
  void (async () => {
    try {
      const { data: profile } = await adminDb
        .from("profiles")
        .select("full_name, email")
        .eq("id", userId)
        .single();

      if (!profile?.email) return;

      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://funduq.com";

      await sendEmail({
        to: profile.email,
        subject: "Action needed: Re-submit your identity document — Funduq",
        react: PassportRejectedEmail({
          guestName: profile.full_name || "Guest",
          reason: reason || undefined,
          baseUrl,
        }),
      });
    } catch (err) {
      console.error("[Admin] Email send failed (passport reject):", err);
    }
  })();

  return { success: true };
}

/**
 * Admin: generate a signed URL for viewing a passport document.
 * The URL is valid for 60 seconds.
 */
export async function getPassportSignedUrl(
  userId: string
): Promise<{ url: string | null; error?: string }> {
  const auth = await verifyAdmin();
  if (!auth.isAdmin) return { url: null, error: auth.error };

  const adminDb = createAdminClient();

  // Get the user's passport path
  const { data: profile } = await adminDb
    .from("profiles")
    .select("passport_url")
    .eq("id", userId)
    .single();

  if (!profile?.passport_url) {
    return { url: null, error: "No document found for this user." };
  }

  const { data, error } = await adminDb.storage
    .from("passport-documents")
    .createSignedUrl(profile.passport_url, 60);

  if (error || !data?.signedUrl) {
    console.error("[Admin] Failed to create signed URL:", error);
    return { url: null, error: "Failed to generate document URL." };
  }

  return { url: data.signedUrl };
}

// ─── Signature Collection ──────────────────────────────────────

/**
 * Admin: toggle a property's `is_signature` flag.
 * Properties flagged as signature appear in the homepage Signature Collections showcase.
 */
export async function toggleSignatureProperty(
  propertyId: string,
  isSignature: boolean
): Promise<ActionResult> {
  const auth = await verifyAdmin();
  if (!auth.isAdmin) return { success: false, error: auth.error };

  const supabase = await createClient();

  const { error } = await supabase
    .from("properties")
    .update({ is_signature: isSignature, updated_at: new Date().toISOString() })
    .eq("id", propertyId);

  if (error) {
    console.error("[Admin] Failed to toggle signature:", error);
    return { success: false, error: "Failed to update signature status." };
  }

  return { success: true };
}

/**
 * Public: fetch active properties marked for the Signature Collection.
 * Returns up to 5 properties for the homepage scroll-driven showcase.
 */
export async function getSignatureProperties(): Promise<
  {
    id: string;
    title: string;
    location: string;
    imageUrl: string;
    priceRange: string;
    bedrooms: number;
    maxGuests: number;
    type: string;
  }[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("properties")
    .select("id, title, location_district, location_emirate, main_image_url, price_min, price_max, bedrooms, max_guests, type")
    .eq("status", "active")
    .eq("is_signature", true)
    .order("updated_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("[Admin] Failed to fetch signature properties:", error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    title: row.title,
    location: `${row.location_district}, ${row.location_emirate}`,
    imageUrl: row.main_image_url || "/images/props/placeholder.png",
    priceRange: `AED ${new Intl.NumberFormat().format(row.price_min)} - ${new Intl.NumberFormat().format(row.price_max)}`,
    bedrooms: row.bedrooms,
    maxGuests: row.max_guests,
    type: row.type,
  }));
}
