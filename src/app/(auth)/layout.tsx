import type { Metadata } from 'next';
import Link from 'next/link';
import { NextIntlClientProvider } from 'next-intl';
import { getHostLocale, getHostMessages } from '@/lib/getHostLocale';

export const metadata: Metadata = {
  title: 'Funduq — Account',
  description:
    'Sign in or create your Funduq account to discover and list luxury properties across the UAE.',
};

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getHostLocale();
  const messages = await getHostMessages(locale);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="min-h-screen bg-offwhite flex flex-col">
        {/* ── Logo Header with Navigation ── */}
        <header className="pt-8 pb-4 px-5">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 gold-gradient rounded-lg flex items-center justify-center shadow-luxury">
                <span className="text-white font-black text-sm display-font">
                  F
                </span>
              </div>
              <span className="text-xl font-black display-font text-charcoal tracking-tight group-hover:text-gold-dark transition-colors duration-300">
                Funduq
              </span>
            </Link>
            <nav className="flex items-center gap-4">
              <Link
                href="/"
                className="text-charcoal/40 hover:text-charcoal text-xs font-bold uppercase tracking-wider transition-colors"
              >
                {locale === "ru" ? "Главная" : "Home"}
              </Link>
              <Link
                href="/villas"
                className="text-charcoal/40 hover:text-charcoal text-xs font-bold uppercase tracking-wider transition-colors"
              >
                {locale === "ru" ? "Коллекция" : "Explore"}
              </Link>
            </nav>
          </div>
        </header>

        {/* ── Centered Form Area ── */}
        <main className="flex-1 flex items-center justify-center px-5 pb-16">
          {children}
        </main>

        {/* ── Minimal Footer ── */}
        <footer className="pb-8 text-center">
          <p className="text-xs text-charcoal/30">
            &copy; {new Date().getFullYear()} Funduq. Luxury living, redefined.
          </p>
        </footer>
      </div>
    </NextIntlClientProvider>
  );
}
