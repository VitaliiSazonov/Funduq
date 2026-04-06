import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * DELETE /api/properties/delete
 * Body: { propertyId: string }
 * Deletes a property owned by the authenticated user.
 */
export async function POST(request: Request) {
  try {
    const { propertyId } = await request.json();

    if (!propertyId || typeof propertyId !== "string") {
      return NextResponse.json(
        { success: false, error: "Invalid property ID" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. Verify the user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // 2. Verify the property belongs to the user
    const { data: property, error: selectError } = await supabase
      .from("properties")
      .select("id, owner_id, title")
      .eq("id", propertyId)
      .single();

    if (selectError || !property) {
      return NextResponse.json(
        { success: false, error: "Property not found" },
        { status: 404 }
      );
    }

    if (property.owner_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "You are not the owner of this property" },
        { status: 403 }
      );
    }

    // 3. Try to delete images from storage (non-blocking)
    try {
      const { data: storageFiles } = await supabase.storage
        .from("properties-images")
        .list(propertyId);

      if (storageFiles && storageFiles.length > 0) {
        const filePaths = storageFiles.map((f) => `${propertyId}/${f.name}`);
        await supabase.storage.from("properties-images").remove(filePaths);
      }
    } catch {
      // Non-critical — don't block deletion
    }

    // 4. Delete the property record
    const { error: deleteError } = await supabase
      .from("properties")
      .delete()
      .eq("id", propertyId);

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: "Failed to delete: " + deleteError.message },
        { status: 500 }
      );
    }

    // 5. Revalidate cached pages
    revalidatePath("/host/dashboard");
    revalidatePath(`/host/properties/${propertyId}`);
    revalidatePath("/en/villas");
    revalidatePath("/ru/villas");

    return NextResponse.json({ success: true, deleted: property.title });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
