import HomeHero from "@/components/home/Hero";
import Destinations from "@/components/home/Destinations";
import Popular from "@/components/home/Popular";
import LatestArrivals from "@/components/home/LatestArrivals";
import WhyFunduq from "@/components/home/WhyFunduq";
import HostCTA from "@/components/home/HostCTA";
import SignatureCollections from "@/components/home/SignatureCollections";
import { getLatestArrivals, getSignatureProperties } from "@/app/actions/properties";
import { getPopularProperties } from "@/app/actions/popularity";
import { getWishlistedIds } from "@/app/actions/wishlist";
import { getSearchLocations } from "@/app/actions/locations";
import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [latestProperties, signatureProperties, popularProperties, wishlistedIds, locations] = await Promise.all([
    getLatestArrivals(),
    getSignatureProperties(),
    getPopularProperties(8),
    getWishlistedIds(),
    getSearchLocations(),
  ]);

  return (
    <div className="flex flex-col">
      {/* Hero with Search */}
      <HomeHero locations={locations} />

      {/* Why Funduq — Guest USPs */}
      <WhyFunduq />

      {/* Curated Destinations */}
      <Destinations />

      {/* Popular — DB-driven, ranked by popularity score */}
      <Popular properties={popularProperties} wishlistedIds={wishlistedIds} />

      {/* Latest Arrivals — DB-driven, shows villas confirmed in last 24h (max 20) */}
      <LatestArrivals properties={latestProperties} />

      {/* Signature Collections — Scroll-driven immersive showcase */}
      <SignatureCollections properties={signatureProperties} />

      {/* Host CTA */}
      <HostCTA />
    </div>
  );
}
