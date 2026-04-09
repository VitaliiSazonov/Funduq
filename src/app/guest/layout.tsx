import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";
import { getHostLocale, getHostMessages } from "@/lib/getHostLocale";
import HostLanguageSwitcher from "@/components/host/HostLanguageSwitcher";
import MobileMenuButton from "@/components/ui/MobileMenuButton";

export default async function GuestLayout({
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

  // ── Load locale & messages for guest pages ──
  const locale = await getHostLocale();
  const messages = await getHostMessages(locale);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {/* ── Fixed Logo Header ── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100"
        style={{ height: 64 }}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-full flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-black text-charcoal display-font tracking-tight hover:text-gold transition-colors duration-300"
          >
            FUNDUQ
          </Link>
          <div className="flex items-center gap-3">
            <HostLanguageSwitcher />
            <MobileMenuButton variant="guest" />
          </div>
        </div>
      </header>
      {/* Push content below fixed header */}
      <div style={{ paddingTop: 64 }}>{children}</div>
    </NextIntlClientProvider>
  );
}
