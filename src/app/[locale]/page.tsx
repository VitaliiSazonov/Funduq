import { ArrowRight } from "lucide-react";
import PropertyCard from "@/components/ui/PropertyCard";
import HomeHero from "@/components/home/Hero";
import Destinations from "@/components/home/Destinations";
import Popular from "@/components/home/Popular";
import LatestArrivals from "@/components/home/LatestArrivals";
import WhyFunduq from "@/components/home/WhyFunduq";
import HostCTA from "@/components/home/HostCTA";
import SignatureCollections from "@/components/home/SignatureCollections";
import { getFeaturedProperties } from "@/app/actions/properties";
import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const properties = await getFeaturedProperties();

  return (
    <div className="flex flex-col">
      {/* Hero with Search */}
      <HomeHero />

      {/* Why Funduq — Guest USPs */}
      <WhyFunduq />

      {/* Curated Destinations */}
      <Destinations />

      {/* Popular — Airbnb-style cards with ratings */}
      <Popular />

      {/* Latest Arrivals — Compact horizontal cards */}
      <LatestArrivals />

      {/* Signature Collections — 2-column equal grid */}
      <SignatureCollections />

      {/* Host CTA */}
      <HostCTA />

      {/* Featured Properties Section (DB-driven, hidden when empty) */}
      {properties.length > 0 && (
        <section className="py-24 px-6 md:px-12 bg-[#f4f4ef]">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
              <div className="flex flex-col gap-4">
                <span className="text-sm font-black text-gold uppercase tracking-[0.2em] display-font">
                  {t("featured_badge")}
                </span>
                <h2 className="text-4xl md:text-5xl font-black text-charcoal display-font tracking-tight">
                  {t("featured_title")}
                </h2>
              </div>
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {properties.map((property) => (
                <PropertyCard key={property.id} {...property} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
