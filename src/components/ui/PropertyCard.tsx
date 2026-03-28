"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Bed, Users, MapPin, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

interface PropertyProps {
  id: string;
  title: string;
  location: string;
  bedrooms: number;
  maxGuests: number;
  priceRange: string;
  imageUrl: string;
}

export default function PropertyCard({
  id,
  title,
  location,
  bedrooms,
  maxGuests,
  priceRange,
  imageUrl,
}: PropertyProps) {
  const t = useTranslations("villas");

  return (
    <Link href={`/villas/${id}`} data-testid="property-card">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        whileHover={{ y: -8 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="group relative flex flex-col overflow-hidden rounded-3xl bg-white border border-gray-100/50 luxury-shadow h-full"
      >
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <motion.div
            whileHover={{ scale: 1.08 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="h-full w-full"
          >
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </motion.div>
          
          {/* Price Tag - Floating */}
          <div className="absolute top-4 left-4 glass px-4 py-2 rounded-full border border-white/50 luxury-shadow flex items-center gap-2">
             <span className="text-[10px] font-bold uppercase tracking-widest text-gold-dark">{t("from")}</span>
             <span className="text-sm font-bold text-charcoal">{priceRange.split('-')[0].trim()}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col flex-grow">
          <div className="flex flex-col gap-1.5 mb-4">
            <h3
              className="text-xl font-bold text-charcoal leading-tight group-hover:text-gold transition-colors duration-300 display-font"
              data-testid="property-card-title"
            >
              {title}
            </h3>
            <div className="flex items-center text-muted text-sm font-medium">
              <MapPin className="w-4 h-4 mr-1.5 text-gold" />
              {location}
            </div>
          </div>

          {/* Specs Grid */}
          <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-100/80 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-offwhite flex items-center justify-center">
                <Bed className="w-4.5 h-4.5 text-gold-dark" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-muted font-bold uppercase">{t("bedrooms")}</span>
                <span className="text-charcoal font-bold text-sm">{bedrooms} {t("rooms")}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-offwhite flex items-center justify-center">
                <Users className="w-4.5 h-4.5 text-gold-dark" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-muted font-bold uppercase">{t("capacity")}</span>
                <span className="text-charcoal font-bold text-sm">{maxGuests} {t("guests")}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-muted uppercase tracking-wider">{t("estimatedRange")}</span>
              <span className="text-charcoal font-black text-lg">{priceRange}</span>
            </div>
            <motion.div
              whileHover={{ x: 3 }}
              className="w-10 h-10 rounded-full border border-gold/30 flex items-center justify-center text-gold-dark group-hover:bg-gold group-hover:text-white transition-all duration-300"
            >
              <ChevronRight className="w-5 h-5" />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
