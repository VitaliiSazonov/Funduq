import { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { dubaiAreas } from "@/data/dubai-areas";
import { setRequestLocale } from "next-intl/server";
import { MapPin, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Holiday Homes by Area in Dubai | Funduq",
  description: "Explore premium holiday homes and villas across Dubai's most popular areas including Dubai Marina, Downtown Dubai, and Palm Jumeirah.",
};

export default async function AreasIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex flex-col min-h-screen pt-32 pb-16 px-4 md:px-8 bg-offwhite">
      <div className="max-w-7xl mx-auto w-full">
        <h1 className="text-4xl md:text-5xl font-black text-charcoal display-font mb-6">
          Explore Dubai by Area
        </h1>
        <p className="text-lg text-muted max-w-3xl mb-12">
          Discover the perfect neighborhood for your stay. From the vibrant beaches of JBR to the luxurious heights of Downtown Dubai, find your ideal holiday home across the city's most desirable locations.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dubaiAreas.map((area) => (
            <Link 
              key={area.slug} 
              href={`/areas/${area.slug}`}
              className="group relative flex flex-col justify-between p-8 rounded-3xl bg-white border border-gray-100/50 luxury-shadow hover:-translate-y-1 transition-transform duration-300 overflow-hidden"
            >
              <div className="relative z-10">
                <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center mb-6 text-gold-dark">
                  <MapPin className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-charcoal mb-3 display-font group-hover:text-gold transition-colors">
                  {locale === "ru" ? area.nameRu : area.name}
                </h2>
                <p className="text-muted line-clamp-3 text-sm leading-relaxed mb-6">
                  {area.descriptionEn}
                </p>
              </div>

              <div className="flex items-center text-sm font-bold text-charcoal uppercase tracking-widest mt-auto z-10 w-fit">
                Explore Area
                <ChevronRight className="w-4 h-4 ml-2 text-gold group-hover:translate-x-1 transition-transform" />
              </div>

              {/* Decorative background accent */}
              <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none transform translate-x-1/4 -translate-y-1/4 group-hover:opacity-[0.04] transition-opacity">
                 <MapPin className="w-48 h-48" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
