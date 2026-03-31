import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function HostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ── Server-side auth guard ──
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not authenticated → login
  if (!user) {
    redirect("/login");
  }

  // Check host (or admin) role in profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // Only host and admin can access host panel
  if (!profile || (profile.role !== "host" && profile.role !== "admin")) {
    redirect("/");
  }

  return <>{children}</>;
}
