import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * DEBUG ONLY — Test property deletion via GET request.
 * GET /api/debug-delete?id=<property_id>&confirm=yes
 * 
 * Without &confirm=yes it only checks if the property exists.
 * With &confirm=yes it actually deletes.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("id");
  const confirm = searchParams.get("confirm");

  if (!propertyId) {
    return NextResponse.json({ error: "Missing id param" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();

    // Step 1: Check if the property exists
    const { data: property, error: selectError } = await admin
      .from("properties")
      .select("id, owner_id, title, status")
      .eq("id", propertyId)
      .single();

    if (selectError) {
      return NextResponse.json(
        { step: "select", error: selectError.message, code: selectError.code },
        { status: 500 }
      );
    }

    if (!property) {
      return NextResponse.json(
        { step: "select", error: "Property not found" },
        { status: 404 }
      );
    }

    // Without confirm=yes, just show the property info
    if (confirm !== "yes") {
      return NextResponse.json({
        message: "Property found. Add &confirm=yes to delete.",
        property,
      });
    }

    // Step 2: Actually delete
    const { error: deleteError } = await admin
      .from("properties")
      .delete()
      .eq("id", propertyId);

    if (deleteError) {
      return NextResponse.json(
        { step: "delete", error: deleteError.message, code: deleteError.code },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deleted: property.title,
      id: propertyId,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { step: "exception", error: message },
      { status: 500 }
    );
  }
}
