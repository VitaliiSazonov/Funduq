import PropertyCatalogue from "@/components/villas/PropertyCatalogue";
import { getAllProperties } from "@/app/actions/properties";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function VillasPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("villas");
  const properties = await getAllProperties();

  return (
    <div className="min-h-screen bg-offwhite flex flex-col">
      {/* Header / Sub-Hero */}
      <section className="bg-charcoal pt-32 pb-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-6 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-white display-font tracking-tight">
            {t("title")}
          </h1>
          <p className="text-gray-400 max-w-xl font-medium">
            {t("subtitle")}
          </p>
        </div>
      </section>

      {/* Main Catalogue */}
      <PropertyCatalogue initialProperties={properties} />

      {/* Footer CTA */}
      <section className="py-20 border-t border-gray-100 mt-12 bg-white">
        <div className="max-w-5xl mx-auto text-center px-6">
          <h4 className="text-2xl font-black text-charcoal display-font mb-4">
            {t("concierge_title")}
          </h4>
          <p className="text-muted mb-8 max-w-lg mx-auto">
            {t("concierge_subtitle")}
          </p>
          <button className="bg-charcoal text-white px-8 py-4 rounded-full font-black hover:bg-gold transition-all duration-300 luxury-shadow">
            {t("concierge_button")}
          </button>
        </div>
      </section>
    </div>
  );
}
