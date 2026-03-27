"use server";

import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/sendEmail";
import PropertyApprovedEmail from "@/lib/email/templates/PropertyApprovedEmail";
import PropertySuspendedEmail from "@/lib/email/templates/PropertySuspendedEmail";

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
      created_at,
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
      created_at,
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
    owner: row.owner as { id: string; full_name: string | null; avatar_url: string | null },
  }));
}
