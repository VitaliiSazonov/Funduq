import { notFound } from "next/navigation";
import { Metadata } from "next";
import { dubaiAreas } from "@/data/dubai-areas";
import { createClient } from "@/lib/supabase/server";
import PropertyCard from "@/components/ui/PropertyCard";
import { getTranslations, setRequestLocale } from "next-intl/server";

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
  const { slug } = await params;
  const area = dubaiAreas.find((a) => a.slug === slug);

  if (!area) return {};

  return {
    title: `Holiday Homes & Villas in ${area.name} | Funduq`,
    description: area.descriptionEn.substring(0, 160) + "...",
    openGraph: {
      title: `${area.name} Holiday Homes | Funduq`,
      description: area.descriptionEn.substring(0, 160) + "...",
      type: "website",
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

  // Search by district/emirate ILIKE %name%
  let { data: rawProperties } = await supabase
    .from("properties")
    .select("*")
    .eq("status", "active")
    .ilike("location_district", `%${area.name}%`);

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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ["Place", "RealEstateAgent"],
    name: area.name,
    description: area.descriptionEn,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Dubai",
      addressCountry: "AE",
    },
  };

  return (
    <div className="flex flex-col min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Header Section */}
      <section className="pt-32 pb-16 px-4 md:px-8 bg-offwhite">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black text-charcoal display-font mb-6">
            {locale === "ru" ? area.nameRu : area.name}
          </h1>
          <p className="text-lg text-muted max-w-4xl leading-relaxed">
            {area.descriptionEn}
          </p>
        </div>
      </section>

      {/* Properties Grid */}
      <section className="py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">
            Available Properties in {area.name}
          </h2>
          {properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {properties.map((prop: any) => (
                <PropertyCard key={prop.id} {...prop} />
              ))}
            </div>
          ) : (
            <p className="text-muted">No properties available in this area at the moment.</p>
          )}
        </div>
      </section>
    </div>
  );
}
