"use client";

import { motion } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import Link from "next/link";
import type { PopularProperty } from "@/app/actions/popularity";
import WishlistButton from "@/components/ui/WishlistButton";

interface PopularProps {
  properties: PopularProperty[];
  wishlistedIds: string[];
}

export default function Popular({ properties, wishlistedIds }: PopularProps) {
  const t = useTranslations("home");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Don't render the section if there are no popular properties
  if (!properties || properties.length === 0) return null;

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = 300;
    el.scrollBy({
      left: direction === "left" ? -cardWidth : cardWidth,
      behavior: "smooth",
    });
    setTimeout(updateScrollState, 350);
  };

  const formatPrice = (min: number) =>
    `AED ${new Intl.NumberFormat().format(min)}`;

  return (
    <section className="py-16 px-6 md:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="display-font text-2xl font-extrabold text-charcoal tracking-tight">
          {t("popular_title")}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-charcoal hover:bg-gray-50 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-default"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-charcoal hover:bg-gray-50 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-default"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Card Row */}
      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        className="flex gap-6 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory lg:grid lg:grid-cols-4 lg:overflow-visible"
      >
        {properties.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="group cursor-pointer min-w-[270px] lg:min-w-0 snap-start"
          >
            <Link href={`/villas/${item.id}`}>
              {/* Square Image */}
              <div className="relative aspect-square rounded-2xl overflow-hidden mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  alt={item.title}
                  src={item.imageUrl}
                />
                {/* Badge — show "Guest Choice" if score > 0, or "Trending" */}
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded-md text-[10px] font-bold shadow-sm uppercase tracking-wider text-charcoal flex items-center gap-1">
                  {item.bookingCount > 0 ? (
                    t("popular_badge")
                  ) : (
                    <>
                      <TrendingUp className="w-3 h-3" />
                      {t("popular_trending", { defaultValue: "Trending" })}
                    </>
                  )}
                </div>
                {/* Wishlist Button */}
                <div className="absolute top-3 right-3">
                  <WishlistButton
                    propertyId={item.id}
                    initialWishlisted={wishlistedIds.includes(item.id)}
                  />
                </div>
              </div>

              {/* Info */}
              <div className="space-y-0.5">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-sm text-charcoal">
                    {item.title}
                  </h3>
                  {item.bookingCount > 0 && (
                    <div className="flex items-center gap-1 text-xs flex-shrink-0 ml-2">
                      <Star className="w-3.5 h-3.5 text-gold fill-gold" />
                      <span className="font-bold">
                        {item.bookingCount}
                        <span className="font-normal text-gray-400 ml-0.5">
                          {item.bookingCount === 1
                            ? t("popular_booking", { defaultValue: "booking" })
                            : t("popular_bookings", {
                                defaultValue: "bookings",
                              })}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">{item.location}</p>
                <p className="text-xs text-gray-500">{item.type} · {item.bedrooms} {item.bedrooms === 1 ? "bedroom" : "bedrooms"}</p>
                <p className="text-sm mt-1.5 font-bold text-charcoal">
                  {formatPrice(item.priceMin)}{" "}
                  <span className="font-normal text-gray-500">
                    {t("arrivals_night")}
                  </span>
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
