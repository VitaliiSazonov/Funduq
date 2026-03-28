"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LOCALE_LABELS: Record<string, string> = {
  en: "EN",
  ru: "RU",
};

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function handleSwitch(nextLocale: string) {
    if (nextLocale === locale) return;
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <div className="flex items-center gap-0.5 rounded-full border border-white/15 bg-white/5 backdrop-blur-md p-0.5">
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
                  : "text-white/50 hover:text-white/80"
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
