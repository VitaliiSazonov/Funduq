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

  // Any authenticated user can access host pages.
  // The "List your property" flow is available to all roles —
  // role upgrade from 'guest' to 'host' happens when they submit a property.
  return <>{children}</>;
}
