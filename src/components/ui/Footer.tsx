"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Link as IntlLink } from "@/i18n/navigation";
import { Mail, MapPin, Globe, MessageCircle } from "lucide-react";

export default function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="bg-charcoal text-white/70">
      {/* ── Main Footer Grid ── */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-20 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <IntlLink
              href="/"
              className="text-2xl font-black text-white display-font tracking-tight hover:text-gold transition-colors duration-300"
            >
              FUNDUQ
            </IntlLink>
            <p className="mt-4 text-sm leading-relaxed max-w-xs">
              {t("tagline")}
            </p>
            <div className="flex items-center gap-4 mt-6">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-gold hover:text-gold transition-all duration-300"
                aria-label="Instagram"
              >
                <Globe className="w-4 h-4" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-gold hover:text-gold transition-all duration-300"
                aria-label="Facebook"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-xs font-black text-gold uppercase tracking-[0.2em] mb-6">
              {t("navTitle")}
            </h4>
            <nav className="flex flex-col gap-3">
              <IntlLink
                href="/villas"
                className="text-sm hover:text-white transition-colors duration-300"
              >
                {t("explore")}
              </IntlLink>
              <Link
                href="/host/dashboard"
                className="text-sm hover:text-white transition-colors duration-300"
              >
                {t("listProperty")}
              </Link>
              <Link
                href="/login"
                className="text-sm hover:text-white transition-colors duration-300"
              >
                {t("signIn")}
              </Link>
            </nav>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-black text-gold uppercase tracking-[0.2em] mb-6">
              {t("legalTitle")}
            </h4>
            <nav className="flex flex-col gap-3">
              <span className="text-sm cursor-default">{t("privacy")}</span>
              <span className="text-sm cursor-default">{t("terms")}</span>
              <span className="text-sm cursor-default">{t("cookies")}</span>
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-black text-gold uppercase tracking-[0.2em] mb-6">
              {t("contactTitle")}
            </h4>
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-gold" />
                <span className="text-sm">{t("address")}</span>
              </div>
              <a
                href="mailto:hello@funduq.com"
                className="flex items-center gap-3 text-sm hover:text-white transition-colors duration-300"
              >
                <Mail className="w-4 h-4 shrink-0 text-gold" />
                hello@funduq.com
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Bar ── */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/30">
            &copy; {new Date().getFullYear()} Funduq. {t("rights")}
          </p>
          <p className="text-xs text-white/20">
            {t("madeIn")}
          </p>
        </div>
      </div>
    </footer>
  );
}
