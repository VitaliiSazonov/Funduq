import PropertyCatalogue from "@/components/villas/PropertyCatalogue";
import { getAllProperties, SortOption } from "@/app/actions/properties";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const VALID_SORTS: SortOption[] = ["price_asc", "price_desc", "newest"];

export default async function VillasPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const resolvedSearchParams = await searchParams;

  const t = await getTranslations("villas");

  // Extract filters from URL search params
  const locationFilter = typeof resolvedSearchParams.location === "string" ? resolvedSearchParams.location : undefined;
  const typeFilter = typeof resolvedSearchParams.type === "string" ? resolvedSearchParams.type : undefined;
  const eventsFilter = typeof resolvedSearchParams.events === "string" ? resolvedSearchParams.events : undefined;

  // Extract sort param
  const rawSort = typeof resolvedSearchParams.sort === "string" ? resolvedSearchParams.sort : undefined;
  const sortFilter: SortOption | undefined = rawSort && VALID_SORTS.includes(rawSort as SortOption)
    ? (rawSort as SortOption)
    : undefined;

  // Parse bedrooms: supports single number (e.g. "3") or comma-separated (e.g. "4,5,6")
  let bedroomsFilter: number | number[] | undefined;
  if (typeof resolvedSearchParams.bedrooms === "string") {
    const raw = resolvedSearchParams.bedrooms;
    if (raw.includes(",")) {
      const parsed = raw.split(",").map(Number).filter((n) => !isNaN(n) && n > 0);
      bedroomsFilter = parsed.length > 0 ? parsed : undefined;
    } else {
      const single = parseInt(raw, 10);
      bedroomsFilter = !isNaN(single) && single > 0 ? single : undefined;
    }
  }

  const properties = await getAllProperties({
    location: locationFilter,
    bedrooms: bedroomsFilter,
    type: typeFilter,
    events: eventsFilter,
    sort: sortFilter,
  });

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
      <PropertyCatalogue
        initialProperties={properties}
        initialLocation={locationFilter}
        initialBedrooms={bedroomsFilter}
        initialType={typeFilter}
        initialEvents={eventsFilter}
        initialSort={sortFilter}
      />

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
