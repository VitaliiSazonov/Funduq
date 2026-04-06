"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ─────────────────────────────────────────────────────────────
// Helper: verify the current user owns the property
// ─────────────────────────────────────────────────────────────
async function verifyOwnership(propertyId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated", supabase: null, userId: null };
  }

  // Verify the property belongs to the user
  const { data: property, error } = await supabase
    .from("properties")
    .select("id, owner_id, status")
    .eq("id", propertyId)
    .single();

  if (error || !property) {
    return { error: "Property not found", supabase: null, userId: null };
  }

  if (property.owner_id !== user.id) {
    return { error: "You are not the owner of this property", supabase: null, userId: null };
  }

  return { error: null, supabase, userId: user.id, property };
}

// ─────────────────────────────────────────────────────────────
// Unpublish (deactivate) a property — sets status to 'inactive'
// ─────────────────────────────────────────────────────────────
export async function unpublishProperty(
  propertyId: string
): Promise<{ success: boolean; error?: string }> {
  const result = await verifyOwnership(propertyId);

  if (result.error || !result.supabase) {
    return { success: false, error: result.error ?? "Unknown error" };
  }

  const { error } = await result.supabase
    .from("properties")
    .update({ status: "inactive" })
    .eq("id", propertyId);

  if (error) {
    console.error("Error unpublishing property:", error);
    return { success: false, error: "Failed to unpublish property" };
  }

  revalidatePath("/host/dashboard");
  revalidatePath(`/host/properties/${propertyId}`);
  revalidatePath("/en/villas");

  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// Republish a property — sets status back to 'active'
// ─────────────────────────────────────────────────────────────
export async function republishProperty(
  propertyId: string
): Promise<{ success: boolean; error?: string }> {
  const result = await verifyOwnership(propertyId);

  if (result.error || !result.supabase) {
    return { success: false, error: result.error ?? "Unknown error" };
  }

  const { error } = await result.supabase
    .from("properties")
    .update({ status: "active" })
    .eq("id", propertyId);

  if (error) {
    console.error("Error republishing property:", error);
    return { success: false, error: "Failed to republish property" };
  }

  revalidatePath("/host/dashboard");
  revalidatePath(`/host/properties/${propertyId}`);
  revalidatePath("/en/villas");

  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// Delete a property permanently
// ─────────────────────────────────────────────────────────────
export async function deleteProperty(
  propertyId: string
): Promise<{ success: boolean; error?: string }> {
  const result = await verifyOwnership(propertyId);

  if (result.error || !result.supabase) {
    return { success: false, error: result.error ?? "Unknown error" };
  }

  // 1. Try to delete images from storage bucket (non-blocking)
  try {
    const { data: storageFiles } = await result.supabase.storage
      .from("properties-images")
      .list(propertyId);

    if (storageFiles && storageFiles.length > 0) {
      const filePaths = storageFiles.map((f) => `${propertyId}/${f.name}`);
      await result.supabase.storage
        .from("properties-images")
        .remove(filePaths);
    }
  } catch (storageErr) {
    // Storage cleanup failure should not block property deletion
    console.warn("Non-critical: failed to clean up storage images:", storageErr);
  }

  // 2. Delete the property record
  const { error } = await result.supabase
    .from("properties")
    .delete()
    .eq("id", propertyId);

  if (error) {
    console.error("Error deleting property:", error);
    return { success: false, error: "Failed to delete property" };
  }

  // 3. Revalidate all relevant paths so Next.js doesn't serve stale cache
  revalidatePath("/host/dashboard");
  revalidatePath(`/host/properties/${propertyId}`);
  revalidatePath("/en/villas");
  revalidatePath("/ru/villas");

  return { success: true };
}
