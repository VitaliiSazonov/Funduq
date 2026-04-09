"use server";

import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export async function verifyUserAdminAction(userId: string) {
  // Verify that the caller is an admin
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Unauthorized");
  }

  // Use service_role to bypass RLS and verify
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) {
    throw new Error("Server configuration error");
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Confirm email in auth.users
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    { email_confirm: true }
  );
  if (authError) {
    console.error("Error confirming email:", authError);
    // Continue anyway; maybe just profiles needs updating
  }

  // 2. Set verified to true in public.profiles
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({ verified: true })
    .eq("id", userId);

  if (profileError) {
    console.error("Error verifying profile:", profileError);
    throw new Error("Failed to verify user profile");
  }

  revalidatePath("/admin/users");
  return { success: true };
}
