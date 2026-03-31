import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import {
  ArrowLeft,
  MapPin,
  BedDouble,
  Bath,
  Users,
  BadgeCheck,
  Clock,
  Ban,
  PartyPopper,
  PawPrint,
  MapPinned,
} from "lucide-react";
import { getProperty, getSimilarProperties } from "@/app/actions/getProperty";
import BookingWidget from "@/components/property/BookingWidget";
import HeroGallery from "@/components/property/HeroGallery";
import DescriptionToggle from "@/components/property/DescriptionToggle";
import AmenitiesGrid from "@/components/property/AmenitiesGrid";
import AvailabilityCalendar from "@/components/property/AvailabilityCalendar";
import ShareButton from "@/components/property/ShareButton";
import PropertyCard from "@/components/ui/PropertyCard";
import { setRequestLocale, getTranslations } from "next-intl/server";

// ─────────────────────────────────────────────────────────────
// Params interface (Next.js 15+: params is a Promise)
// ─────────────────────────────────────────────────────────────
interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

// ─────────────────────────────────────────────────────────────
// Dynamic Metadata
// ─────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const property = await getProperty(id);

  if (!property) {
    return { title: "Property Not Found — Funduq" };
  }

  const ogImage =
    property.images[0]?.url || property.main_image_url || undefined;

  return {
    title: `${property.title} — Funduq | Luxury Villas UAE`,
    description: property.description?.slice(0, 160) || undefined,
    openGraph: {
      title: `${property.title} — Funduq`,
      description: property.description?.slice(0, 160) || undefined,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
  };
}

// ─────────────────────────────────────────────────────────────
// JSON-LD Structured Data
// ─────────────────────────────────────────────────────────────
function buildJsonLd(property: NonNullable<Awaited<ReturnType<typeof getProperty>>>) {
  return {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: property.title,
    description: property.description,
    address: {
      "@type": "PostalAddress",
      addressLocality: property.location_district,
      addressRegion: property.location_emirate,
      addressCountry: "AE",
    },
    priceRange: `AED ${property.price_min} - ${property.price_max}`,
    image: property.images[0]?.url || property.main_image_url || undefined,
    numberOfRooms: property.bedrooms,
    amenityFeature: (property.amenities || []).map((a) => ({
      "@type": "LocationFeatureSpecification",
      name: a,
      value: true,
    })),
  };
}

// ─────────────────────────────────────────────────────────────
// Page Component (Server Component)
// ─────────────────────────────────────────────────────────────
export default async function PropertyDetailPage({ params }: PageProps) {
  const { id, locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("villa");

  const property = await getProperty(id);

  if (!property || property.status !== "active") {
    notFound();
  }

  const similarProperties = await getSimilarProperties(
    property.id,
    property.location_emirate
  );

  const memberSince = property.host.created_at
    ? format(parseISO(property.host.created_at), "MMMM yyyy")
    : null;

  const jsonLd = buildJsonLd(property);

  return (
    <div className="min-h-screen bg-offwhite">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ─── Sticky Header ─── */}
      <header className="border-b border-charcoal/5 bg-white/80 glass sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-3.5 flex items-center justify-between">
          <Link
            href="/villas"
            className="flex items-center gap-2 text-sm font-semibold text-charcoal/50 hover:text-charcoal transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{t("backToCollection")}</span>
            <span className="sm:hidden">{t("back")}</span>
          </Link>
          <Link
            href="/"
            className="text-sm font-bold text-gold hover:text-gold-dark transition-colors display-font"
          >
            Funduq
          </Link>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-6 md:py-10">
        {/* ═══ SECTION 1 — Hero Gallery ═══ */}
        <HeroGallery images={property.images} propertyTitle={property.title} />

        {/* ─── Two-Column Layout ─── */}
        <div className="mt-8 flex flex-col lg:flex-row gap-10">
          {/* ═══ LEFT COLUMN ═══ */}
          <div className="flex-1 min-w-0 space-y-10">
            {/* ═══ SECTION 2 — Header ═══ */}
            <section>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h1
                    className="text-3xl md:text-4xl font-black display-font text-charcoal tracking-tight mb-2"
                    data-testid="property-title"
                  >
                    {property.title}
                  </h1>
                  <div className="flex items-center gap-1.5 text-charcoal/50 mb-4">
                    <MapPin className="w-4 h-4 text-gold" />
                    <span className="text-sm font-medium">
                      {property.location_district},{" "}
                      {property.location_emirate}
                    </span>
                  </div>

                  {/* Key Stats Row */}
                  <div className="flex flex-wrap items-center gap-3 text-sm text-charcoal/60 font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <BedDouble className="w-4 h-4 text-gold-dark" />
                      {property.bedrooms}{" "}
                      {property.bedrooms !== 1 ? t("bedrooms") : t("bedroom")}
                    </span>
                    <span className="text-charcoal/20">·</span>
                    <span className="inline-flex items-center gap-1.5">
                      <Bath className="w-4 h-4 text-gold-dark" />
                      {property.bathrooms}{" "}
                      {property.bathrooms !== 1 ? t("bathrooms") : t("bathroom")}
                    </span>
                    <span className="text-charcoal/20">·</span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-gold-dark" />
                      {t("upToGuests", { count: property.max_guests })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {/* Property Type Badge */}
                  <span className="inline-flex items-center px-3.5 py-1.5 bg-charcoal text-white text-xs font-bold uppercase tracking-wider rounded-full">
                    {property.type}
                  </span>
                  {/* Share Button */}
                  <ShareButton
                    title={property.title}
                    text={t("shareText", { title: property.title })}
                  />
                </div>
              </div>
            </section>

            {/* Divider */}
            <hr className="border-charcoal/5" />

            {/* ═══ SECTION 3 — Host Card ═══ */}
            <section className="flex items-center gap-5 bg-white rounded-2xl border border-charcoal/5 p-5 md:p-6">
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-gold/20 flex-shrink-0">
                {property.host.avatar_url ? (
                  <Image
                    src={property.host.avatar_url}
                    alt={property.host.full_name || "Host"}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <div className="w-full h-full bg-gold/10 flex items-center justify-center">
                    <span className="text-xl font-black text-gold-dark">
                      {(property.host.full_name || "H").charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-lg font-bold text-charcoal truncate">
                    {t("hostedBy", { name: property.host.full_name || "Host" })}
                  </h3>
                  {property.host.verified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase rounded-full flex-shrink-0">
                      <BadgeCheck className="w-3 h-3" />
                      {t("verified")}
                    </span>
                  )}
                </div>
                {memberSince && (
                  <p className="text-xs text-charcoal/40 font-medium">
                    {t("memberSince", { date: memberSince })}
                  </p>
                )}
              </div>
            </section>

            {/* ═══ SECTION 4 — Description ═══ */}
            <section>
              <h2 className="text-xl font-black display-font text-charcoal mb-4">
                {t("aboutProperty")}
              </h2>
              <DescriptionToggle text={property.description || ""} />
            </section>

            {/* ═══ SECTION 5 — Amenities ═══ */}
            {property.amenities && property.amenities.length > 0 && (
              <section>
                <h2 className="text-xl font-black display-font text-charcoal mb-4">
                  {t("whatThisPlaceOffers")}
                </h2>
                <AmenitiesGrid amenities={property.amenities} />
              </section>
            )}

            {/* ═══ SECTION 6 — Availability Calendar ═══ */}
            <section>
              <AvailabilityCalendar propertyId={property.id} />
            </section>

            {/* ═══ SECTION 7 — Location ═══ */}
            <section>
              <h2 className="text-xl font-black display-font text-charcoal mb-4 flex items-center gap-2">
                <MapPinned className="w-5 h-5 text-gold" />
                {t("location")}
              </h2>
              <div className="bg-charcoal/[0.03] rounded-2xl border border-charcoal/5 p-8 flex flex-col items-center justify-center text-center min-h-[240px]">
                <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 text-gold-dark" />
                </div>
                <p className="text-charcoal font-bold text-lg mb-1">
                  {property.location_district}, {property.location_emirate}
                </p>
                <p className="text-sm text-charcoal/40 max-w-sm">
                  {t("addressShared")}
                </p>
              </div>
            </section>

            {/* ═══ SECTION 8 — House Rules ═══ */}
            <section>
              <h2 className="text-xl font-black display-font text-charcoal mb-4">
                {t("houseRules")}
              </h2>
              <div className="bg-white rounded-2xl border border-charcoal/5 p-5 md:p-6 space-y-4">
                {[
                  {
                    icon: Clock,
                    label: t("checkIn"),
                    value: t("checkInValue"),
                  },
                  {
                    icon: Clock,
                    label: t("checkOut"),
                    value: t("checkOutValue"),
                  },
                  {
                    icon: Ban,
                    label: t("smoking"),
                    value: t("smokingValue"),
                  },
                  {
                    icon: PartyPopper,
                    label: t("parties"),
                    value: t("partiesValue"),
                  },
                  {
                    icon: PawPrint,
                    label: t("pets"),
                    value: t("petsValue"),
                  },
                ].map((rule) => (
                  <div
                    key={rule.label}
                    className="flex items-center gap-4"
                  >
                    <div className="w-9 h-9 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                      <rule.icon className="w-4 h-4 text-gold-dark" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-charcoal">
                        {rule.label}
                      </span>
                      <span className="text-sm text-charcoal/50">
                        — {rule.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ═══ SECTION 9 — Similar Properties ═══ */}
            {similarProperties.length > 0 && (
              <section data-testid="similar-properties">
                <h2 className="text-xl font-black display-font text-charcoal mb-6">
                  {t("similarProperties")}
                </h2>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide lg:grid lg:grid-cols-3 lg:overflow-visible">
                  {similarProperties.map((sp) => (
                    <div
                      key={sp.id}
                      className="min-w-[280px] lg:min-w-0 w-[280px] lg:w-auto flex-shrink-0"
                    >
                      <PropertyCard
                        id={sp.id}
                        title={sp.title}
                        location={sp.location}
                        bedrooms={sp.bedrooms}
                        maxGuests={sp.maxGuests}
                        priceRange={sp.priceRange}
                        imageUrl={sp.imageUrl}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ═══ RIGHT COLUMN — Booking Widget ═══ */}
          <div
            className="w-full lg:w-[380px] flex-shrink-0"
            data-testid="booking-widget"
          >
            <div className="lg:sticky lg:top-20">
              <BookingWidget
                propertyId={property.id}
                priceMin={property.price_min}
                priceMax={property.price_max}
                maxGuests={property.max_guests}
                propertyTitle={property.title}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
