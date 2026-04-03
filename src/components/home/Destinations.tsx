"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const DESTINATIONS = [
  {
    key: "uae",
    image: "/images/destinations/uae.png",
    alt: "Luxurious desert resort in the UAE at sunset",
    offset: false,
    filterValue: "UAE",
  },
  {
    key: "florianopolis",
    image: "/images/destinations/florianopolis.png",
    alt: "Pristine beaches of Florianópolis, Brazil",
    offset: true,
    filterValue: "Brazil",
  },
  {
    key: "italy",
    image: "/images/destinations/italy.png",
    alt: "Tuscany landscape with a luxury villa in Italy",
    offset: false,
    filterValue: "Italy",
  },
  {
    key: "spain",
    image: "/images/destinations/spain.png",
    alt: "Mediterranean luxury villa in Mallorca, Spain",
    offset: true,
    filterValue: "Spain",
  },
];

export default function Destinations() {
  const t = useTranslations("home");

  return (
    <section className="py-24 px-6 md:px-8 bg-offwhite">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
          <div className="max-w-xl">
            <h2 className="text-4xl font-black text-charcoal display-font tracking-tight mb-4">
              {t("destinations_title")}
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed">
              {t("destinations_subtitle")}
            </p>
          </div>
          <Link
            href="/villas"
            className="text-gold-dark font-bold hover:underline underline-offset-8 transition-all flex items-center gap-2 group"
          >
            {t("destinations_exploreAll")}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Destination Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {DESTINATIONS.map((dest, i) => (
            <Link
              key={dest.key}
              href={`/villas?location=${encodeURIComponent(dest.filterValue)}`}
            >
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.23, 1, 0.32, 1] }}
                className={`group relative h-[450px] md:h-[500px] overflow-hidden rounded-xl shadow-[0_12px_40px_rgba(26,28,25,0.06)] cursor-pointer ${
                  dest.offset ? "md:mt-12" : ""
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  alt={dest.alt}
                  src={dest.image}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 p-8">
                  <h3 className="display-font text-2xl font-bold text-white mb-1">
                    {t(`dest_${dest.key}_name`)}
                  </h3>
                  <p className="text-white/70 text-sm font-medium">
                    {t(`dest_${dest.key}_count`)}
                  </p>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
