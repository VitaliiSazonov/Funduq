import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProperty } from "@/app/actions/getProperty";
import EditPropertyClient from "./EditPropertyClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPropertyPage({ params }: PageProps) {
  const { id } = await params;

  // Auth guard
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const property = await getProperty(id);

  if (!property) {
    notFound();
  }

  // Only the owner can edit
  if (property.owner_id !== user.id) {
    notFound();
  }

  // Transform property data for the wizard's editData format
  const editData = {
    propertyId: property.id,
    title: property.title,
    description: property.description,
    type: property.type as "Villa" | "Penthouse" | "Resort",
    rental_type: property.events_allowed ? "for_event" : "for_stay" as "all" | "for_stay" | "for_event",
    location_emirate: property.location_emirate,
    location_district: property.location_district,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    max_guests: property.max_guests,
    price_min: property.price_min,
    price_max: property.price_max,
    amenities: property.amenities || [],
    imageUrls: property.images.map((img) => img.url),
  };

  return <EditPropertyClient editData={editData} />;
}
