"use client";

import PropertyCard from "@/components/ui/PropertyCard";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Property } from "@/app/actions/properties";

interface LatestArrivalsProps {
  properties: Property[];
}

export default function LatestArrivals({ properties }: LatestArrivalsProps) {
  const t = useTranslations("home");

  // Don't render if no properties (minimum 1 to display)
  if (!properties || properties.length === 0) return null;

  return (
    <section className="py-24 px-6 md:px-12 bg-[#f4f4ef]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-4"
          >
            <span className="text-sm font-black text-gold uppercase tracking-[0.2em] display-font flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              {t("arrivals_title")}
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-charcoal display-font tracking-tight">
              {t("arrivals_title")}
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed max-w-xl">
              {t("arrivals_subtitle")}
            </p>
          </motion.div>
          <Link
            href="/villas"
            className="flex items-center gap-3 text-charcoal font-bold hover:text-gold transition-colors duration-300 group py-2"
          >
            <span className="border-b-2 border-charcoal/10 group-hover:border-gold transition-colors">
              {t("featured_viewAll")}
            </span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Property Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {properties.map((property) => (
            <PropertyCard key={property.id} {...property} />
          ))}
        </div>
      </div>
    </section>
  );
}
