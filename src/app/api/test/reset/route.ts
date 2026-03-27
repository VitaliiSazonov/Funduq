import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Test-only endpoint to reset the database state for deterministic e2e tests.
 * Only accessible when NEXT_PUBLIC_SUPABASE_URL is set (dev environment).
 *
 * This uses the SERVICE_ROLE key to bypass RLS for test cleanup.
 * The service_role key MUST be set as SUPABASE_SERVICE_ROLE_KEY in .env.local.
 */

export async function POST(request: Request) {
  // Only allow in non-production environments
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 }
    );
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json(
      { error: "Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL" },
      { status: 500 }
    );
  }

  // Create an admin client that bypasses RLS
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const body = await request.json();
    const { hostEmail, hostPassword, guestEmail, guestPassword } = body;

    // ─── 1. Clean up bookings & properties ───
    // Delete all bookings first (FK constraint)
    await supabaseAdmin.from("bookings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    // Delete all properties
    await supabaseAdmin.from("properties").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // ─── 2. Ensure test host and guest users exist ───
    let hostId: string | null = null;
    let guestId: string | null = null;

    // Try to find existing host user
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingHost = existingUsers?.users?.find(
      (u) => u.email === hostEmail
    );
    const existingGuest = existingUsers?.users?.find(
      (u) => u.email === guestEmail
    );

    if (existingHost) {
      hostId = existingHost.id;
    } else {
      // Create host user
      const { data: newHost, error: hostError } =
        await supabaseAdmin.auth.admin.createUser({
          email: hostEmail,
          password: hostPassword,
          email_confirm: true,
        });
      if (hostError) {
        return NextResponse.json(
          { error: `Failed to create host: ${hostError.message}` },
          { status: 500 }
        );
      }
      hostId = newHost.user.id;
    }

    if (existingGuest) {
      guestId = existingGuest.id;
    } else {
      // Create guest user
      const { data: newGuest, error: guestError } =
        await supabaseAdmin.auth.admin.createUser({
          email: guestEmail,
          password: guestPassword,
          email_confirm: true,
        });
      if (guestError) {
        return NextResponse.json(
          { error: `Failed to create guest: ${guestError.message}` },
          { status: 500 }
        );
      }
      guestId = newGuest.user.id;
    }

    // ─── 3. Ensure host profile exists with contact info ───
    await supabaseAdmin.from("profiles").upsert({
      id: hostId,
      email: hostEmail,
      full_name: "Test Host",
      phone: "+971501234567",
      whatsapp: "+971501234567",
      role: "host",
    });

    // ─── 4. Ensure guest profile exists ───
    await supabaseAdmin.from("profiles").upsert({
      id: guestId,
      email: guestEmail,
      full_name: "Test Guest",
      role: "guest",
    });

    return NextResponse.json({
      success: true,
      hostId,
      guestId,
    });
  } catch (err) {
    console.error("Test reset error:", err);
    return NextResponse.json(
      { error: "Internal error during test reset" },
      { status: 500 }
    );
  }
}
