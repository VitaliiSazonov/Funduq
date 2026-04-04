"use client";

import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import ListingWizard from "@/components/host/ListingWizard";
import type { EditPropertyData } from "@/components/host/ListingWizard";

interface EditPropertyClientProps {
  editData: EditPropertyData;
}

export default function EditPropertyClient({ editData }: EditPropertyClientProps) {
  return (
    <div className="min-h-screen bg-offwhite">
      {/* Header */}
      <header className="border-b border-charcoal/5 bg-white/70 glass sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/host/properties/${editData.propertyId}`}
              className="p-2 rounded-lg hover:bg-charcoal/5 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-charcoal" />
            </Link>
            <div>
              <h1 className="text-lg font-black display-font text-charcoal flex items-center gap-2">
                <Pencil className="w-4 h-4 text-gold" />
                Edit Listing
              </h1>
              <p className="text-xs text-charcoal/40 font-medium truncate max-w-[300px]">
                {editData.title}
              </p>
            </div>
          </div>
          <Link
            href={`/host/properties/${editData.propertyId}`}
            className="text-sm font-bold text-charcoal/40 hover:text-charcoal transition-colors"
          >
            Cancel
          </Link>
        </div>
      </header>

      {/* Wizard in edit mode */}
      <main className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        <ListingWizard editData={editData} />
      </main>
    </div>
  );
}
