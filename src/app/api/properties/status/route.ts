import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * POST /api/properties/status
 * Body: { propertyId: string, action: "unpublish" | "republish" }
 */
export async function POST(request: Request) {
  try {
    const { propertyId, action } = await request.json();

    if (!propertyId || typeof propertyId !== "string") {
      return NextResponse.json(
        { success: false, error: "Invalid property ID" },
        { status: 400 }
      );
    }

    if (action !== "unpublish" && action !== "republish") {
      return NextResponse.json(
        { success: false, error: "Invalid action" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. Verify authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // 2. Verify ownership
    const { data: property, error: selectError } = await supabase
      .from("properties")
      .select("id, owner_id, status")
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
        { success: false, error: "You are not the owner" },
        { status: 403 }
      );
    }

    // 3. Update status
    const newStatus = action === "unpublish" ? "inactive" : "active";
    const { error: updateError } = await supabase
      .from("properties")
      .update({ status: newStatus })
      .eq("id", propertyId);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: "Failed to update: " + updateError.message },
        { status: 500 }
      );
    }

    // 4. Revalidate
    revalidatePath("/host/dashboard");
    revalidatePath(`/host/properties/${propertyId}`);
    revalidatePath("/en/villas");
    revalidatePath("/ru/villas");

    return NextResponse.json({ success: true, newStatus });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
