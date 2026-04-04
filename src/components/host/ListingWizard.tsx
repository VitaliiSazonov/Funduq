"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  X,
  ImagePlus,
  Sparkles,
  MapPin,
  BedDouble,
  Bath,
  Users,
  DollarSign,
  Home,
  Tag,
  FileText,
} from "lucide-react";
import { submitProperty } from "@/app/actions/submitProperty";
import { updateProperty } from "@/app/actions/updateProperty";
import type { AirbnbScrapedData } from "@/app/actions/importAirbnb";

// ─────────────────────────────────────────────────────────────
// Zod Schema — matches Supabase `properties` table
// ─────────────────────────────────────────────────────────────
const propertySchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(120, "Title must be 120 characters or less"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(2000, "Description must be 2000 characters or less"),
  type: z.enum(["Villa", "Penthouse"]),
  location_emirate: z.string().min(1, "Please select an emirate"),
  location_district: z
    .string()
    .min(1, "Please select a district"),
  bedrooms: z.number().min(0, "Must be 0 or more").max(20),
  bathrooms: z.number().min(0, "Must be 0 or more").max(20),
  max_guests: z.number().min(1, "Must accommodate at least 1 guest").max(50),
  price_min: z.number().min(100, "Minimum price is AED 100"),
  price_max: z.number().min(100, "Maximum price is AED 100"),
  amenities: z
    .array(z.string())
    .min(1, "Select at least one amenity"),
});

type FormValues = z.infer<typeof propertySchema>;

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const EMIRATE_DISTRICTS: Record<string, string[]> = {
  Dubai: [
    "Palm Jumeirah",
    "Downtown Dubai",
    "Dubai Marina",
    "Jumeirah Beach Residence",
    "Jumeirah",
    "Al Barari",
    "Emirates Hills",
    "Arabian Ranches",
    "Damac Hills",
    "Dubai Hills Estate",
    "Business Bay",
    "DIFC",
    "Bluewaters Island",
    "Dubai Creek Harbour",
    "MBR City",
    "Al Sufouh",
    "Umm Suqeim",
    "Mirdif",
  ],
  "Abu Dhabi": [
    "Saadiyat Island",
    "Yas Island",
    "Al Reem Island",
    "Corniche Area",
    "Al Raha Beach",
    "Khalifa City",
    "Al Maryah Island",
    "Nurai Island",
    "Jubail Island",
    "Al Shamkha",
    "Mohammed Bin Zayed City",
  ],
  Sharjah: [
    "Al Majaz",
    "Al Khan",
    "Al Nahda",
    "Al Taawun",
    "Muwaileh",
    "University City",
    "Al Mamzar",
    "Sharjah Waterfront City",
    "Aljada",
  ],
  Ajman: [
    "Al Rashidiya",
    "Al Nuaimiya",
    "Al Jurf",
    "Corniche Ajman",
    "Al Rawda",
    "Emirates City",
    "Al Helio",
  ],
  "Ras Al Khaimah": [
    "Al Hamra Village",
    "Al Marjan Island",
    "Mina Al Arab",
    "Dafan Al Nakheel",
    "Khuzam",
    "Al Jazeera Al Hamra",
    "Wadi Shah",
  ],
  Fujairah: [
    "Al Fujairah City",
    "Dibba Al Fujairah",
    "Merashid",
    "Al Faseel",
    "Sakamkam",
    "Al Aqah",
  ],
  "Umm Al Quwain": [
    "Old Town",
    "Al Salamah",
    "Al Raas",
    "Umm Al Quwain Marina",
    "Al Dar Al Baida",
  ],
};

const EMIRATES = Object.keys(EMIRATE_DISTRICTS);

const AMENITIES = [
  "Private Pool",
  "Ocean View",
  "Gym",
  "Spa",
  "Chef Kitchen",
  "Home Cinema",
  "Jacuzzi",
  "Private Beach",
  "Helipad",
  "Wine Cellar",
  "Smart Home",
  "Concierge",
  "Pet Friendly",
  "EV Charging",
  "Kids Play Area",
  "BBQ Area",
];

const STEPS = [
  { id: "basics", label: "Basics", icon: Home },
  { id: "details", label: "Details", icon: FileText },
  { id: "amenities", label: "Amenities", icon: Sparkles },
  { id: "gallery", label: "Gallery", icon: ImagePlus },
  { id: "pricing", label: "Pricing", icon: DollarSign },
];

// ─────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────

/** Data shape for editing an existing property */
export interface EditPropertyData {
  propertyId: string;
  title: string;
  description: string;
  type: "Villa" | "Penthouse";
  location_emirate: string;
  location_district: string;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  price_min: number;
  price_max: number;
  amenities: string[];
  imageUrls: string[];
}

interface ListingWizardProps {
  importedData?: AirbnbScrapedData & { uploadedImageUrls: string[] };
  editData?: EditPropertyData;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function ListingWizard({ importedData, editData }: ListingWizardProps) {
  const isEditMode = !!editData;
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [imageUrls, setImageUrls] = useState<string[]>(
    editData?.imageUrls || importedData?.uploadedImageUrls || []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [newImageUrl, setNewImageUrl] = useState("");

  const {
    register,
    handleSubmit,
    control,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: editData
      ? {
          title: editData.title,
          description: editData.description,
          type: editData.type,
          location_emirate: editData.location_emirate,
          location_district: editData.location_district,
          bedrooms: editData.bedrooms,
          bathrooms: editData.bathrooms,
          max_guests: editData.max_guests,
          price_min: editData.price_min,
          price_max: editData.price_max,
          amenities: editData.amenities.filter((a) => AMENITIES.includes(a)),
        }
      : {
          title: importedData?.title || "",
          description: importedData?.description || "",
          type: "Villa",
          location_emirate:
            importedData?.locationEmirate &&
            EMIRATES.includes(importedData.locationEmirate)
              ? importedData.locationEmirate
              : "",
          location_district:
            importedData?.locationDistrict &&
            importedData?.locationEmirate &&
            (
              EMIRATE_DISTRICTS[importedData.locationEmirate] || []
            ).includes(importedData.locationDistrict)
              ? importedData.locationDistrict
              : "",
          bedrooms: importedData?.bedrooms || 1,
          bathrooms: importedData?.bathrooms || 1,
          max_guests: importedData?.maxGuests || 2,
          price_min: importedData?.pricePerNight || 1000,
          price_max: importedData?.pricePerNight
            ? importedData.pricePerNight * 1.5
            : 2000,
          amenities: importedData?.amenities
            ? importedData.amenities.filter((a) => AMENITIES.includes(a))
            : [],
        },
  });

  // Watch selected emirate to dynamically update district options
  const selectedEmirate = watch("location_emirate");

  // ─── Step Navigation ───
  const fieldsPerStep: (keyof FormValues)[][] = [
    ["title", "type", "location_emirate", "location_district"],
    ["description", "bedrooms", "bathrooms", "max_guests"],
    ["amenities"],
    [], // gallery — manual validation
    ["price_min", "price_max"],
  ];

  async function goNext() {
    const fields = fieldsPerStep[currentStep];
    if (fields.length > 0) {
      const valid = await trigger(fields);
      if (!valid) return;
    }
    // Gallery step: require at least one image
    if (currentStep === 3 && imageUrls.length === 0) return;
    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }

  // ─── Image Management ───
  function addImage() {
    if (newImageUrl.trim() && imageUrls.length < 30) {
      setImageUrls((prev) => [...prev, newImageUrl.trim()]);
      setNewImageUrl("");
    }
  }

  function removeImage(index: number) {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  }

  // ─── Submit ───
  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    setSubmitResult(null);

    const payload = {
      title: data.title,
      description: data.description,
      type: data.type,
      location_emirate: data.location_emirate,
      location_district: data.location_district,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      max_guests: data.max_guests,
      price_min: data.price_min,
      price_max: data.price_max,
      amenities: data.amenities,
      imageUrls,
    };

    const result = isEditMode
      ? await updateProperty({ ...payload, propertyId: editData!.propertyId })
      : await submitProperty(payload);

    setIsSubmitting(false);

    if (result.success) {
      setSubmitResult({
        success: true,
        message: isEditMode
          ? "Changes saved successfully! Redirecting..."
          : "Property listed successfully! Redirecting to dashboard...",
      });
    } else {
      setSubmitResult({
        success: false,
        message: result.error || "Something went wrong.",
      });
    }
  }

  // ─── Animation Variants ───
  const stepVariants = {
    enter: { opacity: 0, x: 30 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  };

  // ─── Render Step Content ───
  function renderStep() {
    switch (currentStep) {
      // ═══════════════════════ STEP 0: BASICS ═══════════════════════
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-charcoal/70 mb-2 uppercase tracking-wider">
                Property Title
              </label>
              <input
                {...register("title")}
                placeholder="e.g. Stunning Marina View Penthouse"
                className="w-full px-4 py-3.5 bg-white border border-charcoal/10 rounded-xl text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all"
              />
              {errors.title && (
                <p className="text-red-500 text-xs mt-1.5">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-charcoal/70 mb-2 uppercase tracking-wider">
                Property Type
              </label>
              <Controller<FormValues, "type">
                name="type"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-2 gap-4">
                    {(["Villa", "Penthouse"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => field.onChange(type)}
                        className={`p-4 rounded-xl border-2 font-semibold transition-all duration-300 cursor-pointer ${
                          field.value === type
                            ? "border-gold bg-gold/5 text-gold-dark shadow-luxury"
                            : "border-charcoal/10 text-charcoal/60 hover:border-charcoal/20"
                        }`}
                      >
                        <Home
                          className={`w-6 h-6 mx-auto mb-2 ${
                            field.value === type
                              ? "text-gold"
                              : "text-charcoal/30"
                          }`}
                        />
                        {type}
                      </button>
                    ))}
                  </div>
                )}
              />
              {errors.type && (
                <p className="text-red-500 text-xs mt-1.5">
                  {errors.type.message || "Please select a property type"}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-charcoal/70 mb-2 uppercase tracking-wider">
                  <MapPin className="w-3.5 h-3.5 inline mr-1" />
                  Emirate
                </label>
                <select
                  {...register("location_emirate", {
                    onChange: () => setValue("location_district", ""),
                  })}
                  className="w-full px-4 py-3.5 bg-white border border-charcoal/10 rounded-xl text-charcoal focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all appearance-none"
                >
                  <option value="">Select...</option>
                  {EMIRATES.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
                {errors.location_emirate && (
                  <p className="text-red-500 text-xs mt-1.5">
                    {errors.location_emirate.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-charcoal/70 mb-2 uppercase tracking-wider">
                  District
                </label>
                <select
                  {...register("location_district")}
                  disabled={!selectedEmirate}
                  className="w-full px-4 py-3.5 bg-white border border-charcoal/10 rounded-xl text-charcoal focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all appearance-none disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {selectedEmirate ? "Select district..." : "Select emirate first"}
                  </option>
                  {(EMIRATE_DISTRICTS[selectedEmirate] || []).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                {errors.location_district && (
                  <p className="text-red-500 text-xs mt-1.5">
                    {errors.location_district.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      // ═══════════════════════ STEP 1: DETAILS ═══════════════════════
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-charcoal/70 mb-2 uppercase tracking-wider">
                Description
              </label>
              <textarea
                {...register("description")}
                rows={5}
                placeholder="Describe the property in rich detail..."
                className="w-full px-4 py-3.5 bg-white border border-charcoal/10 rounded-xl text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all resize-none"
              />
              <div className="flex justify-between mt-1.5">
                {errors.description && (
                  <p className="text-red-500 text-xs">
                    {errors.description.message}
                  </p>
                )}
                <p className="text-xs text-charcoal/30 ml-auto">
                  {(watch("description") || "").length}/2000
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-charcoal/70 mb-2 uppercase tracking-wider">
                  <BedDouble className="w-3.5 h-3.5 inline mr-1" />
                  Bedrooms
                </label>
                <input
                  type="number"
                  {...register("bedrooms", { valueAsNumber: true })}
                  className="w-full px-4 py-3.5 bg-white border border-charcoal/10 rounded-xl text-charcoal focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all"
                />
                {errors.bedrooms && (
                  <p className="text-red-500 text-xs mt-1.5">
                    {errors.bedrooms.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-charcoal/70 mb-2 uppercase tracking-wider">
                  <Bath className="w-3.5 h-3.5 inline mr-1" />
                  Bathrooms
                </label>
                <input
                  type="number"
                  {...register("bathrooms", { valueAsNumber: true })}
                  className="w-full px-4 py-3.5 bg-white border border-charcoal/10 rounded-xl text-charcoal focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all"
                />
                {errors.bathrooms && (
                  <p className="text-red-500 text-xs mt-1.5">
                    {errors.bathrooms.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-charcoal/70 mb-2 uppercase tracking-wider">
                  <Users className="w-3.5 h-3.5 inline mr-1" />
                  Max Guests
                </label>
                <input
                  type="number"
                  {...register("max_guests", { valueAsNumber: true })}
                  className="w-full px-4 py-3.5 bg-white border border-charcoal/10 rounded-xl text-charcoal focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all"
                />
                {errors.max_guests && (
                  <p className="text-red-500 text-xs mt-1.5">
                    {errors.max_guests.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      // ═══════════════════════ STEP 2: AMENITIES ═══════════════════════
      case 2:
        return (
          <div className="space-y-4">
            <p className="text-sm text-charcoal/50">
              Select all amenities that apply to your property.
            </p>
            <Controller<FormValues, "amenities">
              name="amenities"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {AMENITIES.map((amenity) => {
                    const isSelected = field.value.includes(amenity);
                    return (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            field.onChange(
                              field.value.filter((a) => a !== amenity)
                            );
                          } else {
                            field.onChange([...field.value, amenity]);
                          }
                        }}
                        className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-300 cursor-pointer ${
                          isSelected
                            ? "border-gold bg-gold/10 text-gold-dark"
                            : "border-charcoal/10 text-charcoal/50 hover:border-charcoal/20 hover:text-charcoal/70"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                          {amenity}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            />
            {errors.amenities && (
              <p className="text-red-500 text-xs mt-1.5">
                {errors.amenities.message}
              </p>
            )}
          </div>
        );

      // ═══════════════════════ STEP 3: GALLERY ═══════════════════════
      case 3:
        return (
          <div className="space-y-6">
            <p className="text-sm text-charcoal/50">
              {importedData
                ? "Your imported images are shown below. Remove or add more as needed."
                : "Add image URLs for your property gallery (up to 10)."}
            </p>

            {/* Add new image */}
            <div className="flex gap-3">
              <input
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Paste image URL..."
                className="flex-1 px-4 py-3 bg-white border border-charcoal/10 rounded-xl text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addImage();
                  }
                }}
              />
              <button
                type="button"
                onClick={addImage}
                disabled={imageUrls.length >= 30 || !newImageUrl.trim()}
                className="px-5 py-3 gold-gradient text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ImagePlus className="w-5 h-5" />
              </button>
            </div>

            {/* Image Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {imageUrls.map((url, i) => (
                  <motion.div
                    key={url + i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative group aspect-[4/3] rounded-xl overflow-hidden border border-charcoal/10"
                  >
                    <img
                      src={url}
                      alt={`Property image ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {/* Badge for first image */}
                    {i === 0 && (
                      <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider bg-gold text-white px-2 py-0.5 rounded-md">
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {imageUrls.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-charcoal/10 rounded-xl">
                <ImagePlus className="w-10 h-10 mx-auto text-charcoal/20 mb-3" />
                <p className="text-charcoal/40 text-sm font-medium">
                  No images added yet
                </p>
              </div>
            )}

            <p className="text-xs text-charcoal/30 text-right">
              {imageUrls.length}/30 images
            </p>
          </div>
        );

      // ═══════════════════════ STEP 4: PRICING ═══════════════════════
      case 4:
        return (
          <div className="space-y-6">
            <p className="text-sm text-charcoal/50 mb-4">
              Set your nightly price range in AED. Guests will see this range on
              the listing.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-charcoal/70 mb-2 uppercase tracking-wider">
                  <Tag className="w-3.5 h-3.5 inline mr-1" />
                  Min Price (AED)
                </label>
                <input
                  type="number"
                  {...register("price_min", { valueAsNumber: true })}
                  className="w-full px-4 py-3.5 bg-white border border-charcoal/10 rounded-xl text-charcoal focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all"
                />
                {errors.price_min && (
                  <p className="text-red-500 text-xs mt-1.5">
                    {errors.price_min.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-charcoal/70 mb-2 uppercase tracking-wider">
                  <Tag className="w-3.5 h-3.5 inline mr-1" />
                  Max Price (AED)
                </label>
                <input
                  type="number"
                  {...register("price_max", { valueAsNumber: true })}
                  className="w-full px-4 py-3.5 bg-white border border-charcoal/10 rounded-xl text-charcoal focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all"
                />
                {errors.price_max && (
                  <p className="text-red-500 text-xs mt-1.5">
                    {errors.price_max.message}
                  </p>
                )}
              </div>
            </div>

            {/* Price Preview */}
            <div className="mt-6 p-6 bg-charcoal rounded-2xl text-white">
              <p className="text-xs uppercase tracking-widest text-gold-light mb-2">
                Listing Preview
              </p>
              <p className="text-2xl font-black display-font">
                AED{" "}
                {new Intl.NumberFormat().format(watch("price_min") || 0)}{" "}
                <span className="text-white/40 font-normal">–</span>{" "}
                {new Intl.NumberFormat().format(watch("price_max") || 0)}
              </p>
              <p className="text-white/50 text-sm mt-1">per night</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  // ─── Success State ───
  // Auto-redirect after success
  useEffect(() => {
    if (submitResult?.success) {
      const timer = setTimeout(() => {
        if (isEditMode && editData) {
          router.push(`/host/properties/${editData.propertyId}`);
        } else {
          router.push("/host/dashboard");
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [submitResult, isEditMode, editData, router]);

  if (submitResult?.success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg mx-auto text-center py-20"
      >
        <div className="w-20 h-20 mx-auto mb-6 gold-gradient rounded-full flex items-center justify-center">
          <Check className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-black display-font text-charcoal mb-3">
          {isEditMode ? "Updated!" : "Congratulations!"}
        </h2>
        <p className="text-charcoal/50 text-lg">{submitResult.message}</p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl mx-auto">
      {/* ─── Step Indicator ─── */}
      <div className="flex items-center justify-between mb-10">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isActive = i === currentStep;
          const isCompleted = i < currentStep;
          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <motion.div
                  animate={{
                    scale: isActive ? 1.15 : 1,
                    backgroundColor: isActive
                      ? "#C5A059"
                      : isCompleted
                      ? "#A37F3F"
                      : "#F5F5F5",
                  }}
                  className="w-11 h-11 rounded-full flex items-center justify-center mb-2"
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <Icon
                      className={`w-5 h-5 ${
                        isActive ? "text-white" : "text-charcoal/30"
                      }`}
                    />
                  )}
                </motion.div>
                <span
                  className={`text-[11px] font-semibold uppercase tracking-wider ${
                    isActive
                      ? "text-gold-dark"
                      : isCompleted
                      ? "text-charcoal/60"
                      : "text-charcoal/25"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-px mx-3 mt-[-20px] ${
                    isCompleted ? "bg-gold" : "bg-charcoal/10"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* ─── Step Content ─── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          variants={stepVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="bg-white rounded-2xl border border-charcoal/5 p-8 shadow-luxury min-h-[380px]"
        >
          <h3 className="text-xl font-black display-font text-charcoal mb-6">
            {STEPS[currentStep].label}
          </h3>
          {renderStep()}
        </motion.div>
      </AnimatePresence>

      {/* ─── Navigation ─── */}
      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={goBack}
          disabled={currentStep === 0}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-charcoal/60 font-semibold hover:text-charcoal transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {currentStep < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={goNext}
            className="flex items-center gap-2 px-8 py-3 gold-gradient text-white rounded-xl font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-8 py-3 gold-gradient text-white rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {isEditMode ? "Save Changes" : "Publish Listing"}
              </>
            )}
          </button>
        )}
      </div>

      {/* ─── Error Banner ─── */}
      {submitResult && !submitResult.success && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center"
        >
          {submitResult.message}
        </motion.div>
      )}
    </form>
  );
}
