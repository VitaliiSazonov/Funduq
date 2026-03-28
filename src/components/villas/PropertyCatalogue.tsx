"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { SlidersHorizontal, ArrowDownZA, LayoutGrid, List, Search } from "lucide-react";
import PropertyCard from "@/components/ui/PropertyCard";
import { Property } from "@/app/actions/properties";
import { useTranslations } from "next-intl";

interface PropertyCatalogueProps {
  initialProperties: Property[];
}

export default function PropertyCatalogue({ initialProperties }: PropertyCatalogueProps) {
  const [search, setSearch] = useState("");
  const t = useTranslations("villas");

  const filteredProperties = initialProperties.filter((p) => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Filter Top-Bar Sticker */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-gray-100 shadow-sm py-4 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide w-full md:w-auto pb-1 md:pb-0">
             <button className="px-4 py-2 bg-charcoal text-white rounded-full text-sm font-bold shadow-md">{t("allProperties")}</button>
             <button className="px-4 py-2 hover:bg-offwhite rounded-full text-sm font-medium text-muted transition-colors">{t("villasTab")}</button>
             <button className="px-4 py-2 hover:bg-offwhite rounded-full text-sm font-medium text-muted transition-colors">{t("penthouses")}</button>
             <button className="px-4 py-2 hover:bg-offwhite rounded-full text-sm font-medium text-muted transition-colors">{t("desertResorts")}</button>
             <div className="w-px h-6 bg-gray-200 mx-2" />
             <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full text-sm font-bold text-charcoal hover:border-gold transition-colors">
                <SlidersHorizontal className="w-4 h-4" />
                <span>{t("filters")}</span>
             </button>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
             <div className="flex-1 md:w-64 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-gold transition-colors" />
                <input 
                  type="text" 
                  placeholder={t("searchPlaceholder")} 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-offwhite rounded-full text-sm font-medium border-transparent focus:border-gold/50 focus:ring-0 transition-all outline-none" 
                />
             </div>
             <div className="flex items-center gap-1 border border-gray-100 rounded-lg p-1">
                <button className="p-2 bg-offwhite rounded-md text-charcoal"><LayoutGrid className="w-4 h-4" /></button>
                <button className="p-2 text-muted hover:text-charcoal"><List className="w-4 h-4" /></button>
             </div>
          </div>
        </div>
      </div>

      {/* Grid Section */}
      <section className="py-12 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
             <span className="text-xs font-black text-muted uppercase tracking-[0.2em]">{filteredProperties.length} {t("propertiesFound")}</span>
             <button className="flex items-center gap-2 text-sm font-bold text-charcoal hover:text-gold transition-colors group">
                <ArrowDownZA className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>{t("priceLowHigh")}</span>
             </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProperties.length > 0 ? (
              filteredProperties.map((property, idx) => (
                <motion.div
                  key={property.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: idx * 0.05 }}
                >
                  <PropertyCard {...property} />
                </motion.div>
              ))
            ) : (
                <div className="col-span-full py-20 text-center">
                    <p className="text-muted text-lg font-medium">{t("noResults")}</p>
                </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
