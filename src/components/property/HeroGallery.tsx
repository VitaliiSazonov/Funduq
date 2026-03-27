"use client";

import { useState } from "react";
import Image from "next/image";
import { Images } from "lucide-react";
import GalleryModal from "./GalleryModal";
import type { PropertyImage } from "@/app/actions/getProperty";

interface HeroGalleryProps {
  images: PropertyImage[];
  propertyTitle: string;
}

export default function HeroGallery({
  images,
  propertyTitle,
}: HeroGalleryProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);

  function openModal(index: number) {
    setModalIndex(index);
    setModalOpen(true);
  }

  // Ensure we have at least 1 image
  const displayImages = images.length > 0
    ? images
    : [{ url: "/images/props/placeholder.png", order: 0 }];

  const mainImage = displayImages[0];
  const sideImages = displayImages.slice(1, 5);

  return (
    <>
      <div
        data-testid="property-gallery"
        className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-2 rounded-3xl overflow-hidden h-[280px] md:h-[420px] lg:h-[480px]"
      >
        {/* Main large image */}
        <button
          onClick={() => openModal(0)}
          className="relative md:col-span-2 md:row-span-2 overflow-hidden cursor-pointer group"
        >
          <Image
            src={mainImage.url}
            alt={propertyTitle}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700 ease-luxury"
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>

        {/* Side images */}
        {sideImages.map((img, idx) => (
          <button
            key={img.url}
            onClick={() => openModal(idx + 1)}
            className="relative hidden md:block overflow-hidden cursor-pointer group"
          >
            <Image
              src={img.url}
              alt={`${propertyTitle} - ${idx + 2}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700 ease-luxury"
              sizes="25vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
        ))}

        {/* Fill empty grid slots if less than 4 side images */}
        {Array.from({ length: Math.max(0, 4 - sideImages.length) }).map(
          (_, idx) => (
            <div
              key={`placeholder-${idx}`}
              className="hidden md:block bg-charcoal/5"
            />
          )
        )}
      </div>

      {/* Show All Photos button */}
      {displayImages.length > 1 && (
        <button
          onClick={() => openModal(0)}
          className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-charcoal/10 rounded-full text-sm font-bold text-charcoal hover:bg-charcoal hover:text-white transition-all duration-300 cursor-pointer"
        >
          <Images className="w-4 h-4" />
          Show all {displayImages.length} photos
        </button>
      )}

      {/* Gallery Modal */}
      {modalOpen && (
        <GalleryModal
          images={displayImages}
          initialIndex={modalIndex}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
