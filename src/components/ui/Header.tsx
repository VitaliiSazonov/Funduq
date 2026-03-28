"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link as IntlLink } from "@/i18n/navigation";
import NextLink from "next/link";
import { Menu, X } from "lucide-react";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

export default function Header() {
  const t = useTranslations("nav");
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`
        fixed top-0 left-0 right-0 z-50 transition-all duration-500
        ${
          scrolled
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
        >
          FUNDUQ
        </IntlLink>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {/* /villas lives inside [locale] → use intl Link */}
          <IntlLink
            href="/villas"
            className="text-white/70 hover:text-white text-sm font-bold uppercase tracking-wider transition-colors duration-300"
          >
            {t("explore")}
          </IntlLink>
          {/* /host lives OUTSIDE [locale] → use next/link */}
          <NextLink
            href="/host/dashboard"
            className="text-white/70 hover:text-white text-sm font-bold uppercase tracking-wider transition-colors duration-300"
          >
            {t("listProperty")}
          </NextLink>
        </nav>

        {/* Right side: Language switcher + Login */}
        <div className="hidden md:flex items-center gap-4">
          <LanguageSwitcher />
          {/* /login lives OUTSIDE [locale] → use next/link */}
          <NextLink
            href="/login"
            className="px-6 py-2.5 rounded-full bg-gold text-white text-sm font-black uppercase tracking-wider hover:bg-gold-dark transition-all duration-300 luxury-shadow"
          >
            {t("login")}
          </NextLink>
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

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-charcoal/95 backdrop-blur-xl border-t border-white/10">
          <div className="px-6 py-6 flex flex-col gap-4">
            <IntlLink
              href="/villas"
              className="text-white/70 hover:text-white text-sm font-bold uppercase tracking-wider transition-colors py-2"
              onClick={() => setMobileOpen(false)}
            >
              {t("explore")}
            </IntlLink>
            <NextLink
              href="/host/dashboard"
              className="text-white/70 hover:text-white text-sm font-bold uppercase tracking-wider transition-colors py-2"
              onClick={() => setMobileOpen(false)}
            >
              {t("listProperty")}
            </NextLink>
            <hr className="border-white/10 my-2" />
            <NextLink
              href="/login"
              className="inline-flex justify-center px-6 py-3 rounded-full bg-gold text-white text-sm font-black uppercase tracking-wider hover:bg-gold-dark transition-all duration-300"
              onClick={() => setMobileOpen(false)}
            >
              {t("login")}
            </NextLink>
          </div>
        </div>
      )}
    </header>
  );
}
