import PropertyCatalogue from "@/components/villas/PropertyCatalogue";
import { getAllProperties } from "../actions/properties";

export default async function VillasPage() {
  const properties = await getAllProperties();

  return (
    <div className="min-h-screen bg-offwhite flex flex-col">
      {/* Header / Sub-Hero (Static Server Component) */}
      <section className="bg-charcoal pt-32 pb-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-6 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-white display-font tracking-tight">
            Exclusive Collection
          </h1>
          <p className="text-gray-400 max-w-xl font-medium">
            Explore our curated selection of ultra-luxury villas and penthouses available for short-term stays across the UAE.
          </p>
        </div>
      </section>

      {/* Main Experience (Client Component with Server-Fetched Data) */}
      <PropertyCatalogue initialProperties={properties} />

      {/* Footer Nav Hook */}
      <section className="py-20 border-t border-gray-100 mt-12 bg-white">
         <div className="max-w-5xl mx-auto text-center px-6">
            <h4 className="text-2xl font-black text-charcoal display-font mb-4">Can&apos;t find what you&apos;re looking for?</h4>
            <p className="text-muted mb-8 max-w-lg mx-auto">Our concierges are available 24/7 to help you find the perfect villa for your stay in Dubai and across the UAE.</p>
            <button className="bg-charcoal text-white px-8 py-4 rounded-full font-black hover:bg-gold transition-all duration-300 luxury-shadow">
               Chat with Concierge
            </button>
         </div>
      </section>
    </div>
  );
}
