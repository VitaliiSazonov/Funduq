import HomeHero from "@/components/home/Hero";
import Destinations from "@/components/home/Destinations";
import Popular from "@/components/home/Popular";
import LatestArrivals from "@/components/home/LatestArrivals";
import WhyFunduq from "@/components/home/WhyFunduq";
import HostCTA from "@/components/home/HostCTA";
import SignatureCollections from "@/components/home/SignatureCollections";
import { getLatestArrivals, getSignatureProperties } from "@/app/actions/properties";
import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [latestProperties, signatureProperties] = await Promise.all([
    getLatestArrivals(),
    getSignatureProperties(),
  ]);

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

      {/* Latest Arrivals — DB-driven, shows villas confirmed in last 24h (max 20) */}
      <LatestArrivals properties={latestProperties} />

      {/* Signature Collections — Scroll-driven immersive showcase */}
      <SignatureCollections properties={signatureProperties} />

      {/* Host CTA */}
      <HostCTA />
    </div>
  );
}
