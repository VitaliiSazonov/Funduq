"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Bed, Users, MapPin, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface HostPropertyCardProps {
  id: string;
  title: string;
  location: string;
  bedrooms: number;
  maxGuests: number;
  priceRange: string;
  imageUrl: string;
  status?: string;
}

export default function HostPropertyCard({
  id,
  title,
  location,
  bedrooms,
  maxGuests,
  priceRange,
  imageUrl,
  status,
}: HostPropertyCardProps) {
  const t = useTranslations("host");

  const statusConfig: Record<string, { labelKey: string; bg: string; text: string }> = {
    active: { labelKey: "statusActive", bg: "bg-green-100", text: "text-green-700" },
    pending_review: { labelKey: "statusPending", bg: "bg-amber-100", text: "text-amber-700" },
    suspended: { labelKey: "statusSuspended", bg: "bg-red-100", text: "text-red-700" },
    inactive: { labelKey: "statusInactive", bg: "bg-gray-100", text: "text-gray-600" },
  };
  const st = statusConfig[status ?? "active"] ?? statusConfig.active;

  return (
    <Link href={`/host/properties/${id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        whileHover={{ y: -8 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="group relative flex flex-col overflow-hidden rounded-3xl bg-white border border-gray-100/50 luxury-shadow h-full"
      >
        {/* Image */}
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
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          </motion.div>

          {/* Status Badge */}
          <div className="absolute top-4 left-4 glass px-3 py-1.5 rounded-full border border-white/50 luxury-shadow">
            <span className={`text-[10px] font-black uppercase tracking-wider ${st.text}`}>
              {t(st.labelKey as any)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col flex-grow">
          <h3 className="text-lg font-bold text-charcoal leading-tight group-hover:text-gold transition-colors duration-300 display-font mb-1.5">
            {title}
          </h3>
          <div className="flex items-center text-muted text-sm font-medium mb-4">
            <MapPin className="w-4 h-4 mr-1.5 text-gold" />
            {location}
          </div>

          {/* Specs */}
          <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-100/80 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-offwhite flex items-center justify-center">
                <Bed className="w-4 h-4 text-gold-dark" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-muted font-bold uppercase">{t("bedrooms")}</span>
                <span className="text-charcoal font-bold text-sm">{bedrooms}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-offwhite flex items-center justify-center">
                <Users className="w-4 h-4 text-gold-dark" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-muted font-bold uppercase">{t("guests")}</span>
                <span className="text-charcoal font-bold text-sm">{maxGuests}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-muted uppercase tracking-wider">{t("priceRange")}</span>
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
