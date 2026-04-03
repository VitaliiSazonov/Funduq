"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import HeroSearchBar from "./HeroSearchBar";
import type { LocationSuggestion } from "@/app/actions/locations";

interface HomeHeroProps {
  locations: LocationSuggestion[];
}

export default function HomeHero({ locations }: HomeHeroProps) {
  const t = useTranslations("home");

  return (
    <section className="relative h-[95vh] min-h-[700px] flex items-center justify-center bg-charcoal overflow-x-clip px-4">
      {/* Background Visual Overlay */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--color-gold)_0%,_transparent_100%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-charcoal/40 via-transparent to-charcoal/80" />

      <div className="relative z-10 w-full max-w-6xl flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
        >
          <span className="inline-block px-5 py-2 rounded-full border border-white/20 text-white/70 text-xs font-bold uppercase tracking-[0.3em] backdrop-blur-md mb-8">
            {t("hero_badge")}
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="text-5xl md:text-8xl font-black text-white mb-6 display-font tracking-tight"
        >
          {t("hero_title")} <br /> <span className="text-gold">{t("hero_title_accent")}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="text-gray-300 md:text-xl max-w-2xl mb-12 font-medium"
        >
          {t("hero_subtitle")}
        </motion.p>

        {/* Interactive Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="w-full flex justify-center"
        >
          <HeroSearchBar locations={locations} />
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-40"
      >
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white">{t("scroll")}</span>
        <div className="w-px h-12 bg-gradient-to-b from-white to-transparent" />
      </motion.div>
    </section>
  );
}
