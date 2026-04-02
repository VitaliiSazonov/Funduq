"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { MapPin, Bed, Users, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

interface SignatureProperty {
  id: string;
  title: string;
  location: string;
  imageUrl: string;
  priceRange: string;
  bedrooms: number;
  maxGuests: number;
  type: string;
}

interface SignatureCollectionsProps {
  properties: SignatureProperty[];
}

/* ── Slide colors: smooth background transition per slide ── */
const SLIDE_COLORS = [
  "#0a0a0a",
  "#0d1117",
  "#111318",
  "#0e100f",
  "#0c0e14",
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function interpolateColor(c1: string, c2: string, t: number) {
  const a = hexToRgb(c1);
  const b = hexToRgb(c2);
  const r = Math.round(lerp(a.r, b.r, t));
  const g = Math.round(lerp(a.g, b.g, t));
  const bl = Math.round(lerp(a.b, b.b, t));
  return `rgb(${r}, ${g}, ${bl})`;
}

export default function SignatureCollections({
  properties,
}: SignatureCollectionsProps) {
  const t = useTranslations("home");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [activeSlide, setActiveSlide] = useState(0);

  // Don't render if no signature properties
  if (!properties || properties.length === 0) return null;

  const slideCount = properties.length;
  const wrapperHeight = `${slideCount * 100}vh`;

  /* ── Scroll handler ── */
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handleScroll = useCallback(() => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const scrollableHeight = rect.height - window.innerHeight;
    if (scrollableHeight <= 0) return;

    const rawProgress = Math.max(0, Math.min(1, -rect.top / scrollableHeight));
    setProgress(rawProgress);
    setActiveSlide(
      Math.min(slideCount - 1, Math.floor(rawProgress * slideCount))
    );
  }, [slideCount]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  /* ── Compute per-slide opacity & scale ── */
  const getSlideStyle = (index: number) => {
    const slideProgress = progress * slideCount;
    const diff = slideProgress - index;
    const absDiff = Math.abs(diff);

    // Active: fully visible. Fading: transitioning in/out.
    const opacity = Math.max(0, 1 - absDiff * 1.5);
    const scale = lerp(0.85, 1, Math.max(0, 1 - absDiff * 0.5));

    return {
      opacity,
      transform: `scale(${scale})`,
    };
  };

  /* ── Background color interpolation ── */
  const colorIndex = Math.min(slideCount - 1, Math.floor(progress * slideCount));
  const nextColorIndex = Math.min(slideCount - 1, colorIndex + 1);
  const colorT = (progress * slideCount) - colorIndex;
  const bgColor = interpolateColor(
    SLIDE_COLORS[colorIndex % SLIDE_COLORS.length],
    SLIDE_COLORS[nextColorIndex % SLIDE_COLORS.length],
    colorT
  );

  return (
    <section
      ref={wrapperRef}
      style={{ height: wrapperHeight }}
      className="relative"
    >
      {/* Sticky viewport */}
      <div
        className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center"
        style={{ background: bgColor, transition: "background 0.1s linear" }}
      >
        {/* Section title — only visible at start */}
        <div
          className="absolute top-8 left-1/2 -translate-x-1/2 z-20 text-center"
          style={{
            opacity: progress < 0.05 ? 1 : Math.max(0, 1 - progress * 20),
            transition: "opacity 0.3s ease",
          }}
        >
          <span className="text-xs font-black text-gold uppercase tracking-[0.3em] display-font">
            {t("collections_featured")}
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white display-font tracking-tight mt-2">
            {t("collections_title")}
          </h2>
        </div>

        {/* Slides */}
        {properties.map((property, index) => {
          const style = getSlideStyle(index);
          return (
            <Link
              key={property.id}
              href={`/villas/${property.id}`}
              className="absolute inset-0 flex items-center justify-center"
              style={{
                opacity: style.opacity,
                transform: style.transform,
                pointerEvents: activeSlide === index ? "auto" : "none",
                zIndex: activeSlide === index ? 10 : 1,
                transition: "opacity 0.15s ease, transform 0.15s ease",
              }}
            >
              {/* Full-screen image */}
              <div className="absolute inset-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={property.imageUrl}
                  alt={property.title}
                  className="w-full h-full object-cover"
                  loading={index < 2 ? "eager" : "lazy"}
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
              </div>

              {/* Caption */}
              <div
                className="relative z-10 text-center text-white px-6 max-w-2xl"
                style={{
                  opacity: style.opacity,
                  transform: `translateY(${(1 - style.opacity) * 40}px)`,
                  transition: "opacity 0.3s ease, transform 0.3s ease",
                }}
              >
                <span className="inline-block bg-gold/20 backdrop-blur-sm text-gold-light px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.25em] mb-4 border border-gold/30">
                  {property.type}
                </span>
                <h3 className="text-3xl md:text-5xl display-font font-black mb-3 leading-tight">
                  {property.title}
                </h3>
                <div className="flex items-center justify-center gap-2 text-white/80 text-sm mb-4">
                  <MapPin className="w-4 h-4" />
                  <span>{property.location}</span>
                </div>
                <div className="flex items-center justify-center gap-6 text-white/70 text-sm mb-6">
                  <span className="flex items-center gap-1.5">
                    <Bed className="w-4 h-4" />
                    {property.bedrooms} Beds
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    {property.maxGuests} Guests
                  </span>
                </div>
                <p className="text-xl font-black text-gold">
                  {property.priceRange}
                </p>
                <div className="mt-6 inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm font-semibold">
                  View Property <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          );
        })}

        {/* Dot navigation — right side */}
        <div className="absolute right-6 md:right-10 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-3">
          {properties.map((_, index) => (
            <button
              key={index}
              className="relative w-3 h-3 rounded-full transition-all duration-300 cursor-pointer"
              style={{
                background:
                  activeSlide === index
                    ? "#C5A059"
                    : "rgba(255,255,255,0.25)",
                transform: activeSlide === index ? "scale(1.4)" : "scale(1)",
                boxShadow:
                  activeSlide === index
                    ? "0 0 12px rgba(197,160,89,0.5)"
                    : "none",
              }}
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => {
                if (!wrapperRef.current) return;
                const rect = wrapperRef.current.getBoundingClientRect();
                const scrollableHeight = rect.height - window.innerHeight;
                const targetProgress = index / slideCount;
                const targetScroll =
                  wrapperRef.current.offsetTop +
                  targetProgress * scrollableHeight;
                window.scrollTo({ top: targetScroll, behavior: "smooth" });
              }}
            />
          ))}
        </div>

        {/* Progress bar — bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-30 h-1 bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-gold/60 to-gold transition-all duration-100 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        {/* Slide counter */}
        <div
          className="absolute bottom-6 left-6 md:left-10 z-30 text-white/40 text-sm font-mono"
        >
          <span className="text-gold font-bold text-lg">{String(activeSlide + 1).padStart(2, "0")}</span>
          <span className="mx-1">/</span>
          <span>{String(slideCount).padStart(2, "0")}</span>
        </div>
      </div>

      <style>{`
        .signature-scroll-section {
          /* Avoid CLS */
          contain: layout style;
        }
      `}</style>
    </section>
  );
}
