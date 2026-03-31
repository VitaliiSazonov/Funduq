import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

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
  // Role upgrade from 'guest' to 'host' happens when they submit a property.
  return (
    <>
      {/* ── Fixed Logo Header ── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100"
        style={{ height: 64 }}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-full flex items-center">
          <Link
            href="/"
            className="text-xl font-black text-charcoal display-font tracking-tight hover:text-gold transition-colors duration-300"
          >
            FUNDUQ
          </Link>
        </div>
      </header>
      {/* Push content below fixed header */}
      <div style={{ paddingTop: 64 }}>{children}</div>
    </>
  );
}
