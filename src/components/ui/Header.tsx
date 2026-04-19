"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link as IntlLink } from "@/i18n/navigation";
import NextLink from "next/link";
import { Menu, X, Search, Building2, LogIn, LogOut, CalendarDays, User, Home, MapPin, BookOpen } from "lucide-react";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import UserMenu from "@/components/ui/UserMenu";
import { signOutAction } from "@/app/actions/auth";

interface HeaderProps {
  user?: {
    email?: string;
    role?: string | null;
    user_metadata?: {
      full_name?: string;
      [key: string]: unknown;
    };
  } | null;
}

export default function Header({ user }: HeaderProps) {
  const t = useTranslations("nav");
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const userEmail = user?.email ?? "";
  const userFullName = user?.user_metadata?.full_name ?? null;
  const userRole = user?.role ?? null;

  return (
    <>
    <header
      className={`
        fixed top-0 left-0 right-0 z-50 transition-all duration-500
        ${
          scrolled || mobileOpen
            ? "bg-charcoal/90 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.3)] py-3"
            : "bg-transparent py-5"
        }
      `}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Logo — locale-aware link to home */}
        <IntlLink
          href="/"
          className="text-xl md:text-2xl font-black text-white display-font tracking-tight hover:text-gold transition-colors duration-300"
          onClick={() => setMobileOpen(false)}
        >
          FUNDUQ
        </IntlLink>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <IntlLink
            href="/villas"
            className="text-white/70 hover:text-white text-sm font-bold uppercase tracking-wider transition-colors duration-300"
          >
            {t("explore")}
          </IntlLink>
          <IntlLink
            href="/areas"
            className="text-white/70 hover:text-white text-sm font-bold uppercase tracking-wider transition-colors duration-300"
          >
            Areas
          </IntlLink>
          <IntlLink
            href="/blog"
            className="text-white/70 hover:text-white text-sm font-bold uppercase tracking-wider transition-colors duration-300"
          >
            Blog
          </IntlLink>
          <NextLink
            href="/host/dashboard"
            className="text-white/70 hover:text-white text-sm font-bold uppercase tracking-wider transition-colors duration-300"
          >
            {t("listProperty")}
          </NextLink>
        </nav>

        {/* Right side: Language switcher + Login / UserMenu */}
        <div className="hidden md:flex items-center gap-4">
          <LanguageSwitcher />
          {user ? (
            <UserMenu email={userEmail} fullName={userFullName} role={userRole} />
          ) : (
            <NextLink
              href="/login"
              className="px-6 py-2.5 rounded-full bg-gold text-white text-sm font-black uppercase tracking-wider hover:bg-gold-dark transition-all duration-300 luxury-shadow"
            >
              {t("login")}
            </NextLink>
          )}
        </div>

        {/* Mobile Hamburger */}
        <div className="flex md:hidden items-center gap-3">
          <LanguageSwitcher />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </header>

      {/* ─── Full-Screen Mobile Menu ─── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 top-[56px] bg-charcoal/98 backdrop-blur-2xl z-[60] animate-slideDown overflow-y-auto">
          <nav className="flex flex-col px-6 pt-8 pb-12 min-h-full">
            {/* ── Navigation Links ── */}
            <div className="flex flex-col gap-1">
              <IntlLink
                href="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl text-white/60 hover:text-white hover:bg-white/5 active:bg-white/10 transition-all duration-200"
              >
                <Home className="w-5 h-5" />
                <span className="text-base font-bold">{t("home")}</span>
              </IntlLink>

              <IntlLink
                href="/villas"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl text-white/60 hover:text-white hover:bg-white/5 active:bg-white/10 transition-all duration-200"
              >
                <Search className="w-5 h-5" />
                <span className="text-base font-bold">{t("explore")}</span>
              </IntlLink>

              <IntlLink
                href="/areas"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl text-white/60 hover:text-white hover:bg-white/5 active:bg-white/10 transition-all duration-200"
              >
                <MapPin className="w-5 h-5" />
                <span className="text-base font-bold">Areas</span>
              </IntlLink>

              <IntlLink
                href="/blog"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl text-white/60 hover:text-white hover:bg-white/5 active:bg-white/10 transition-all duration-200"
              >
                <BookOpen className="w-5 h-5" />
                <span className="text-base font-bold">Blog</span>
              </IntlLink>

              <NextLink
                href="/host/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl text-white/60 hover:text-white hover:bg-white/5 active:bg-white/10 transition-all duration-200"
              >
                <Building2 className="w-5 h-5" />
                <span className="text-base font-bold">{t("listProperty")}</span>
              </NextLink>
            </div>

            {/* ── Divider ── */}
            <div className="my-4 mx-5 border-t border-white/[0.06]" />

            {/* ── User Section ── */}
            {user ? (
              <div className="flex flex-col gap-1">
                {/* User info */}
                <div className="flex items-center gap-3 px-5 py-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-white font-black text-sm shrink-0">
                    {userFullName
                      ? userFullName.charAt(0).toUpperCase()
                      : userEmail.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-bold text-sm truncate">
                      {userFullName || userEmail.split("@")[0]}
                    </p>
                    <p className="text-white/30 text-xs truncate">{userEmail}</p>
                  </div>
                </div>

                <NextLink
                  href="/guest/bookings"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-4 px-5 py-4 rounded-2xl text-white/60 hover:text-white hover:bg-white/5 active:bg-white/10 transition-all duration-200"
                >
                  <CalendarDays className="w-5 h-5" />
                  <span className="text-base font-bold">{t("myBookings")}</span>
                </NextLink>

                <NextLink
                  href="/guest/profile"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-4 px-5 py-4 rounded-2xl text-white/60 hover:text-white hover:bg-white/5 active:bg-white/10 transition-all duration-200"
                >
                  <User className="w-5 h-5" />
                  <span className="text-base font-bold">{t("myProfile")}</span>
                </NextLink>

                <div className="my-4 mx-5 border-t border-white/[0.06]" />

                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-red-400 hover:text-red-300 hover:bg-red-500/5 active:bg-red-500/10 transition-all duration-200 cursor-pointer"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="text-base font-bold">{t("signOut")}</span>
                  </button>
                </form>
              </div>
            ) : (
               <div className="flex flex-col gap-3 mt-2 px-2">
                <NextLink
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gold text-white font-black text-base uppercase tracking-wider hover:bg-gold-dark transition-all duration-300 luxury-shadow"
                >
                  <LogIn className="w-5 h-5" />
                  {t("login")}
                </NextLink>
              </div>
            )}

            {/* ── Bottom branding ── */}
            <div className="mt-auto pt-8 flex items-center justify-center gap-3">
              <div className="h-px w-10 bg-white/[0.06]" />
              <span className="text-[10px] font-black text-white/10 uppercase tracking-[0.3em]">
                FUNDUQ
              </span>
              <div className="h-px w-10 bg-white/[0.06]" />
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
