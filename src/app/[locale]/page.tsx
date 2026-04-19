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

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is Funduq?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Funduq is a holiday homes and short-term rental platform in Dubai, UAE. We offer verified apartments, villas, and studios with transparent pricing and flexible check-in."
        }
      },
      {
        "@type": "Question", 
        "name": "How do I book a holiday home in Dubai through Funduq?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Browse our verified listings, select your dates and property, and submit a booking request. Our team will confirm availability within 24 hours."
        }
      },
      {
        "@type": "Question",
        "name": "Are all Funduq properties verified?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. All properties on Funduq are reviewed and verified by our moderation team before being published on the platform."
        }
      },
      {
        "@type": "Question",
        "name": "What areas in Dubai does Funduq cover?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Funduq covers all major areas of Dubai including Downtown Dubai, Dubai Marina, JBR, Palm Jumeirah, Business Bay, DIFC, and more."
        }
      }
    ]
  };

  return (
    <div className="flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
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
