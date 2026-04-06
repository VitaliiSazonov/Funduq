import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * DEBUG ONLY — Test property deletion with anon key (no RLS bypass).
 * GET /api/debug-delete?id=<property_id>&confirm=yes
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("id");
  const confirm = searchParams.get("confirm");

  if (!propertyId) {
    return NextResponse.json({ error: "Missing id param" }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Report env status (not the actual values!)
  const envStatus = {
    SUPABASE_URL: url ? `set (${url.length} chars)` : "MISSING",
    ANON_KEY: anonKey ? `set (${anonKey.length} chars)` : "MISSING",
    SERVICE_ROLE_KEY: serviceKey ? `set (${serviceKey.length} chars)` : "MISSING",
  };

  if (!url || !anonKey) {
    return NextResponse.json({ error: "Missing Supabase env vars", envStatus }, { status: 500 });
  }

  // Use anon key (no auth, just public access)
  const supabase = createClient(url, anonKey);

  try {
    // Step 1: Try SELECT (should work for active properties due to public RLS)
    const { data: property, error: selectError } = await supabase
      .from("properties")
      .select("id, owner_id, title, status")
      .eq("id", propertyId)
      .maybeSingle();

    if (selectError) {
      return NextResponse.json({
        step: "select",
        error: selectError.message,
        code: selectError.code,
        envStatus,
      });
    }

    if (!property) {
      return NextResponse.json({
        step: "select",
        error: "Property not found or not visible with anon key",
        envStatus,
      });
    }

    // Without confirm=yes, just report the status
    if (confirm !== "yes") {
      return NextResponse.json({
        message: "Property found. Add &confirm=yes to delete.",
        property,
        envStatus,
      });
    }

    // Step 2: Try DELETE with anon key
    const { error: deleteError, count } = await supabase
      .from("properties")
      .delete({ count: "exact" })
      .eq("id", propertyId);

    return NextResponse.json({
      step: "delete_attempted",
      deleteError: deleteError ? { message: deleteError.message, code: deleteError.code } : null,
      rowsDeleted: count,
      envStatus,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ step: "exception", error: message, envStatus });
  }
}
