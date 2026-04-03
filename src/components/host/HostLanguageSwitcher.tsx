"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { routing } from "@/i18n/routing";

const LOCALE_LABELS: Record<string, string> = {
  en: "EN",
  ru: "RU",
};

/**
 * Language switcher for host pages (outside the [locale] segment).
 * Persists the chosen locale in a cookie and refreshes the page.
 */
export default function HostLanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();

  function handleSwitch(nextLocale: string) {
    if (nextLocale === locale) return;
    // Set the NEXT_LOCALE cookie (1 year expiry)
    document.cookie = `NEXT_LOCALE=${nextLocale};path=/;max-age=31536000;SameSite=Lax`;
    router.refresh();
  }

  return (
    <div className="flex items-center gap-0.5 rounded-full border border-charcoal/10 bg-offwhite p-0.5">
      {routing.locales.map((loc) => {
        const isActive = loc === locale;
        return (
          <button
            key={loc}
            onClick={() => handleSwitch(loc)}
            aria-label={`Switch language to ${LOCALE_LABELS[loc]}`}
            className={`
              relative px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider
              rounded-full transition-all duration-300 cursor-pointer
              ${
                isActive
                  ? "bg-gold text-white shadow-[0_2px_8px_rgba(197,160,89,0.35)]"
                  : "text-charcoal/40 hover:text-charcoal/70"
              }
            `}
          >
            {LOCALE_LABELS[loc]}
          </button>
        );
      })}
    </div>
  );
}
