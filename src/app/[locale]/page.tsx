import HomeHero from "@/components/home/Hero";
import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
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
import FaqAccordion from "@/components/property/FaqAccordion";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { locale } = await params;
  const isRu = locale === "ru";
  const description = isRu
    ? "Funduq — эксклюзивные виллы, пентхаусы и дома для отдыха по всему Дубаю, Абу-Даби и ОАЭ. Бронируйте напрямую по цене владельца без комиссии."
    : "Funduq — curated luxury villas, penthouses and holiday homes across Dubai, Abu Dhabi and UAE. Book directly at owner's price with 0% guest commission.";

  return {
    description,
    openGraph: {
      images: [{ url: "https://funduq.ae/images/og-default.jpg" }],
    },
    twitter: {
      card: "summary_large_image",
    },
    alternates: {
      canonical: locale === "ru" ? "https://funduq.ae/ru" : "https://funduq.ae",
      languages: {
        en: "https://funduq.ae/en",
        ru: "https://funduq.ae/ru",
      },
    },
  };
}

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

  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Funduq",
    "description": locale === "ru"
      ? "Funduq — эксклюзивные виллы, пентхаусы и дома для отдыха по всему Дубаю, Абу-Даби и ОАЭ. Бронируйте напрямую по цене владельца без комиссии."
      : "Funduq — curated luxury villas, penthouses and holiday homes across Dubai, Abu Dhabi and UAE. Book directly at owner's price with 0% guest commission.",
    "url": "https://funduq.ae",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Dubai",
      "addressCountry": "AE"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "hello@funduq.com",
      "contactType": "customer service"
    }
  };

  const faqs = locale === "ru"
    ? [
        {
          question: "Что такое Funduq?",
          answer: "Funduq — это платформа для аренды домов для отдыха и краткосрочного проживания в Дубае, ОАЭ. Мы предлагаем проверенные апартаменты, виллы и студии с прозрачными ценами и гибким заселением."
        },
        {
          question: "Как забронировать жилье через Funduq?",
          answer: "Просмотрите наши проверенные объявления, выберите даты и объект недвижимости, а затем отправьте запрос на бронирование. Наша команда подтвердит доступность в течение 24 часов."
        },
        {
          question: "Все ли объекты на Funduq проходят проверку?",
          answer: "Да. Все объекты недвижимости на Funduq проходят строгую проверку нашей командой модераторов перед публикацией на платформе."
        },
        {
          question: "Какие районы Дубая охватывает сервис?",
          answer: "Funduq охватывает все основные районы Дубая, включая Downtown Dubai, Dubai Marina, JBR, Palm Jumeirah, Business Bay, DIFC и другие."
        }
      ]
    : [
        {
          question: "What is Funduq?",
          answer: "Funduq is a holiday homes and short-term rental platform in Dubai, UAE. We offer verified apartments, villas, and studios with transparent pricing and flexible check-in."
        },
        {
          question: "How do I book a holiday home through Funduq?",
          answer: "Browse our verified listings, select your dates and property, and submit a booking request. Our team will confirm availability within 24 hours."
        },
        {
          question: "Are all Funduq properties verified?",
          answer: "Yes. All properties on Funduq are reviewed and verified by our moderation team before being published on the platform."
        },
        {
          question: "What areas in Dubai does Funduq cover?",
          answer: "Funduq covers all major areas of Dubai including Downtown Dubai, Dubai Marina, JBR, Palm Jumeirah, Business Bay, DIFC, and more."
        }
      ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <div className="flex flex-col">
      <JsonLd data={localBusinessJsonLd} />
      <JsonLd data={faqJsonLd} />
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

      {/* FAQ Section */}
      <section className="py-24 px-4 md:px-8 bg-offwhite">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black display-font text-charcoal text-center mb-12">
            {locale === "ru" ? "Часто задаваемые вопросы" : "Frequently Asked Questions"}
          </h2>
          <FaqAccordion faqs={faqs} />
        </div>
      </section>

      {/* Host CTA */}
      <HostCTA />
    </div>
  );
}
