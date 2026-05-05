import { notFound } from "next/navigation";
import { Metadata } from "next";
import { dubaiAreas } from "@/data/dubai-areas";
import { createClient } from "@/lib/supabase/server";
import PropertyCard from "@/components/ui/PropertyCard";
import { setRequestLocale } from "next-intl/server";
import JsonLd from "@/components/seo/JsonLd";

export async function generateStaticParams() {
  return dubaiAreas.map((area) => ({
    slug: area.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const area = dubaiAreas.find((a) => a.slug === slug);

  if (!area) return {};

  const isRu = locale === "ru";
  const name = isRu ? area.nameRu : area.name;
  const description = isRu ? area.descriptionRu : area.descriptionEn;
  const slicedDescription = (description || "").substring(0, 160);

  return {
    title: `Holiday Homes & Villas in ${name} | Funduq`,
    description: slicedDescription + "...",
    openGraph: {
      title: `${name} | Funduq`,
      description: slicedDescription,
      images: [{ url: "https://funduq.ae/images/og-default.jpg" }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} | Funduq`,
      description: slicedDescription,
      images: ["https://funduq.ae/images/og-default.jpg"],
    },
    alternates: {
      canonical: locale === "ru" ? `https://funduq.ae/ru/areas/${slug}` : `https://funduq.ae/areas/${slug}`,
      languages: {
        en: `https://funduq.ae/en/areas/${slug}`,
        ru: `https://funduq.ae/ru/areas/${slug}`,
      },
    },
  };
}

export default async function AreaPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const area = dubaiAreas.find((a) => a.slug === slug);
  if (!area) notFound();

  const supabase = await createClient();

  // Map area slugs to their possible district names in Supabase
  const slugToDistricts: Record<string, string[]> = {
    "dubai-marina": ["Dubai Marina", "dubai marina"],
    "downtown-dubai": ["Downtown Dubai", "Downtown", "downtown dubai", "downtown"],
    "palm-jumeirah": ["Palm Jumeirah", "palm jumeirah"],
    "business-bay": ["Business Bay", "business bay"],
    "jumeirah-beach-residence": ["Jumeirah Beach Residence", "JBR", "jumeirah beach residence", "jbr"],
    "difc": ["DIFC", "difc"],
  };

  const targetDistricts = slugToDistricts[slug] || [area.name];

  let { data: rawProperties } = await supabase
    .from("properties")
    .select("*")
    .eq("status", "active")
    .in("location_district", targetDistricts);

  // If no properties found, show all active listings as fallback
  if (!rawProperties || rawProperties.length === 0) {
    const { data: allActive } = await supabase
      .from("properties")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(12);
    rawProperties = allActive;
  }

  const properties = (rawProperties || []).map((row: any) => ({
    id: row.id,
    title: row.title,
    location: `${row.location_district}, ${row.location_emirate}`,
    bedrooms: row.bedrooms,
    maxGuests: row.max_guests,
    priceRange: `AED ${new Intl.NumberFormat().format(row.price_min)} - ${new Intl.NumberFormat().format(row.price_max)}`,
    imageUrl: row.main_image_url || "/images/props/placeholder.png",
  }));

  const areaName = locale === "ru" ? area.nameRu : area.name;

  const minPrice = rawProperties && rawProperties.length > 0
    ? Math.min(...rawProperties.map((row: any) => row.price_min || 1500))
    : 1500;
  const formattedMinPrice = new Intl.NumberFormat().format(minPrice);

  const placeJsonLd = {
    "@context": "https://schema.org",
    "@type": ["Place", "RealEstateAgent"],
    name: areaName,
    description: locale === "ru" ? area.descriptionRu : area.descriptionEn,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Dubai",
      addressCountry: "AE",
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://funduq.ae"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": areaName,
        "item": `https://funduq.ae/${locale}/areas/${slug}`
      }
    ]
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": locale === "ru"
          ? `Как арендовать виллу в ${areaName} без комиссии?`
          : `How to rent a villa in ${areaName} without commission?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": locale === "ru"
            ? "На Funduq гости не платят комиссию (0%). Связывайтесь с владельцем напрямую."
            : "On Funduq, guests pay 0% commission. Contact the owner directly."
        }
      },
      {
        "@type": "Question",
        "name": locale === "ru"
          ? `Какова средняя цена виллы в ${areaName}?`
          : `What is the average villa price in ${areaName}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": locale === "ru"
            ? `Цены начинаются от AED ${formattedMinPrice} за ночь.`
            : `Prices start from AED ${formattedMinPrice} per night.`
        }
      }
    ]
  };

  return (
    <div className="flex flex-col min-h-screen">
      <JsonLd data={placeJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={faqJsonLd} />
      
      {/* Header Section */}
      <section className="pt-32 pb-16 px-4 md:px-8 bg-charcoal text-white">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black text-white display-font mb-6 text-center md:text-left">
            {locale === "ru" ? area.nameRu : area.name}
          </h1>
          <p className="text-lg text-white/70 max-w-4xl leading-relaxed whitespace-pre-line text-center md:text-left">
            {locale === "ru" ? area.descriptionRu : area.descriptionEn}
          </p>
        </div>
      </section>

      {/* Properties Grid */}
      <section className="py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">
            {locale === "ru" ? `Доступные объекты в ${area.nameRu}` : `Available Properties in ${area.name}`}
          </h2>
          {properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {properties.map((prop: any) => (
                <PropertyCard key={prop.id} {...prop} />
              ))}
            </div>
          ) : (
            <p className="text-muted">
              {locale === "ru" ? "В данный момент в этом районе нет доступных объектов." : "No properties available in this area at the moment."}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

