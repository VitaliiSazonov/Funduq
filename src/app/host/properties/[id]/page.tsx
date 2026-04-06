import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import {
  ArrowLeft,
  MapPin,
  BedDouble,
  Bath,
  Users,
  BadgeCheck,
  Eye,
  ExternalLink,
  Calendar,
  Home,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Pencil,
} from "lucide-react";
import { getProperty } from "@/app/actions/getProperty";
import { createClient } from "@/lib/supabase/server";
import { getHostLocale, getHostMessages } from "@/lib/getHostLocale";
import HeroGallery from "@/components/property/HeroGallery";
import AmenitiesGrid from "@/components/property/AmenitiesGrid";
import AvailabilityCalendar from "@/components/property/AvailabilityCalendar";
import PropertyManageActions from "@/components/host/PropertyManageActions";

// ─────────────────────────────────────────────────────────────
// Params (Next.js 15+: params is a Promise)
// ─────────────────────────────────────────────────────────────
interface PageProps {
  params: Promise<{ id: string }>;
}

// ─────────────────────────────────────────────────────────────
// Dynamic Metadata
// ─────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const property = await getProperty(id);

  if (!property) {
    return { title: "Property Not Found — Funduq Host" };
  }

  return {
    title: `${property.title} — Host Dashboard | Funduq`,
    description: `Manage your listing: ${property.title}`,
  };
}

// ─────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────
export default async function HostPropertyDetailPage({ params }: PageProps) {
  const { id } = await params;

  // Auth guard — only the owner can view
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

  // Only the owner can view this page
  if (property.owner_id !== user.id) {
    notFound();
  }

  // ── Load translations ──
  const locale = await getHostLocale();
  const messages = await getHostMessages(locale);
  const h = messages.host;

  // ── Status Config (localized) ──
  const statusConfig: Record<
    string,
    {
      label: string;
      icon: React.ElementType;
      bg: string;
      text: string;
      border: string;
      description: string;
    }
  > = {
    active: {
      label: h.statusActive,
      icon: CheckCircle2,
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      description: h.statusActiveDesc,
    },
    pending_review: {
      label: h.statusPending,
      icon: Clock,
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      description: h.statusPendingDesc,
    },
    suspended: {
      label: h.statusSuspended,
      icon: XCircle,
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200",
      description: h.statusSuspendedDesc,
    },
    draft: {
      label: h.statusDraft,
      icon: AlertCircle,
      bg: "bg-gray-50",
      text: "text-gray-600",
      border: "border-gray-200",
      description: h.statusDraftDesc,
    },
    inactive: {
      label: h.statusInactive,
      icon: XCircle,
      bg: "bg-gray-50",
      text: "text-gray-600",
      border: "border-gray-200",
      description: h.statusInactiveDesc,
    },
  };

  const st = statusConfig[property.status] ?? statusConfig.active;
  const StatusIcon = st.icon;

  const createdDate = property.created_at
    ? format(parseISO(property.created_at), "MMMM d, yyyy")
    : "Unknown";

  const memberSince = property.host.created_at
    ? format(parseISO(property.host.created_at), "MMMM yyyy")
    : null;

  return (
    <div className="min-h-screen bg-offwhite">
      {/* ─── Sticky Header ─── */}
      <header className="border-b border-charcoal/5 bg-white/80 backdrop-blur-xl sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-3.5 flex items-center justify-between">
          <Link
            href="/host/dashboard"
            className="flex items-center gap-2 text-sm font-semibold text-charcoal/50 hover:text-charcoal transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{h.backToDashboard}</span>
            <span className="sm:hidden">{h.dashboardShort}</span>
          </Link>
          <div className="flex items-center gap-3">
            {property.status === "active" && (
              <Link
                href={`/en/villas/${property.id}`}
                target="_blank"
                className="flex items-center gap-2 text-sm font-bold text-gold hover:text-gold-dark transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">{h.viewPublicPage}</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-6 md:py-10">
        {/* ═══ Status Banner ═══ */}
        <section
          className={`${st.bg} ${st.border} border rounded-2xl p-5 md:p-6 mb-8 flex items-start gap-4`}
        >
          <div
            className={`w-10 h-10 rounded-xl ${st.bg} flex items-center justify-center flex-shrink-0`}
          >
            <StatusIcon className={`w-5 h-5 ${st.text}`} />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span
                className={`text-xs font-black uppercase tracking-wider ${st.text}`}
              >
                {st.label}
              </span>
            </div>
            <p className={`text-sm ${st.text} opacity-80`}>{st.description}</p>
          </div>
        </section>

        {/* ═══ Gallery ═══ */}
        {property.images.length > 0 && (
          <HeroGallery images={property.images} propertyTitle={property.title} />
        )}

        {/* ─── Two-Column Layout ─── */}
        <div className="mt-8 flex flex-col lg:flex-row gap-10">
          {/* ═══ LEFT COLUMN ═══ */}
          <div className="flex-1 min-w-0 space-y-10">
            {/* ═══ Property Header ═══ */}
            <section>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-black display-font text-charcoal tracking-tight mb-2">
                    {property.title}
                  </h1>
                  <div className="flex items-center gap-1.5 text-charcoal/50 mb-4">
                    <MapPin className="w-4 h-4 text-gold" />
                    <span className="text-sm font-medium">
                      {property.location_district}, {property.location_emirate}
                    </span>
                  </div>

                  {/* Key Stats */}
                  <div className="flex flex-wrap items-center gap-3 text-sm text-charcoal/60 font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <BedDouble className="w-4 h-4 text-gold-dark" />
                      {property.bedrooms}{" "}
                      {property.bedrooms !== 1 ? h.bedrooms : h.bedroom}
                    </span>
                    <span className="text-charcoal/20">·</span>
                    <span className="inline-flex items-center gap-1.5">
                      <Bath className="w-4 h-4 text-gold-dark" />
                      {property.bathrooms}{" "}
                      {property.bathrooms !== 1 ? h.bathrooms : h.bathroom}
                    </span>
                    <span className="text-charcoal/20">·</span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-gold-dark" />
                      {h.upToGuests.replace('{count}', String(property.max_guests))}
                    </span>
                  </div>
                </div>

                {/* Type Badge */}
                <span className="inline-flex items-center px-3.5 py-1.5 bg-charcoal text-white text-xs font-bold uppercase tracking-wider rounded-full flex-shrink-0">
                  {property.type}
                </span>
              </div>
            </section>

            <hr className="border-charcoal/5" />

            {/* ═══ Quick Info Cards ═══ */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  icon: DollarSign,
                  label: h.priceRangeLabel,
                  value: `AED ${new Intl.NumberFormat().format(property.price_min)} - ${new Intl.NumberFormat().format(property.price_max)}`,
                },
                {
                  icon: Home,
                  label: h.propertyType,
                  value: property.type,
                },
                {
                  icon: Calendar,
                  label: h.listedOn,
                  value: createdDate,
                },
                {
                  icon: Eye,
                  label: h.statusLabel,
                  value: st.label,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-white rounded-2xl border border-charcoal/5 p-5 flex flex-col gap-3"
                >
                  <div className="w-9 h-9 rounded-xl bg-gold/10 flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-gold-dark" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal/40 block mb-1">
                      {item.label}
                    </span>
                    <span className="text-sm font-bold text-charcoal">
                      {item.value}
                    </span>
                  </div>
                </div>
              ))}
            </section>

            {/* ═══ Description ═══ */}
            {property.description && (
              <section>
                <h2 className="text-xl font-black display-font text-charcoal mb-4">
                  {h.description}
                </h2>
                <div className="bg-white rounded-2xl border border-charcoal/5 p-5 md:p-6">
                  <p className="text-charcoal/70 leading-relaxed whitespace-pre-line">
                    {property.description}
                  </p>
                </div>
              </section>
            )}

            {/* ═══ Amenities ═══ */}
            {property.amenities && property.amenities.length > 0 && (
              <section>
                <h2 className="text-xl font-black display-font text-charcoal mb-4">
                  {h.amenities}
                </h2>
                <AmenitiesGrid amenities={property.amenities} />
              </section>
            )}

            {/* ═══ Availability Calendar ═══ */}
            <section>
              <AvailabilityCalendar propertyId={property.id} />
            </section>
          </div>

          {/* ═══ RIGHT COLUMN — Management Panel ═══ */}
          <div className="w-full lg:w-[380px] flex-shrink-0">
            <div className="lg:sticky lg:top-36 space-y-6">
              {/* Owner Card */}
              <div className="bg-white rounded-2xl border border-charcoal/5 p-6">
                <h3 className="text-sm font-black uppercase tracking-wider text-charcoal/40 mb-4">
                  {h.propertyOwner}
                </h3>
                <div className="flex items-center gap-4">
                  <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-gold/20 flex-shrink-0">
                    {property.host.avatar_url ? (
                      <Image
                        src={property.host.avatar_url}
                        alt={property.host.full_name || "Host"}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <div className="w-full h-full bg-gold/10 flex items-center justify-center">
                        <span className="text-lg font-black text-gold-dark">
                          {(property.host.full_name || "H")
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-base font-bold text-charcoal truncate">
                        {property.host.full_name || "You"}
                      </span>
                      {property.host.verified && (
                        <BadgeCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                    {memberSince && (
                      <p className="text-xs text-charcoal/40 font-medium">
                        {h.memberSince.replace('{date}', memberSince)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl border border-charcoal/5 p-6 space-y-3">
                <h3 className="text-sm font-black uppercase tracking-wider text-charcoal/40 mb-4">
                  {h.quickActions}
                </h3>

                {property.status === "active" && (
                  <Link
                    href={`/en/villas/${property.id}`}
                    target="_blank"
                    className="flex items-center gap-3 w-full px-5 py-3.5 rounded-xl bg-charcoal text-white font-bold text-sm hover:bg-gold transition-all duration-300"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {h.viewPublicListing}
                  </Link>
                )}

                <Link
                  href={`/host/properties/${property.id}/edit`}
                  className="flex items-center gap-3 w-full px-5 py-3.5 rounded-xl border border-gold/30 text-gold-dark font-bold text-sm hover:bg-gold/5 hover:border-gold transition-all duration-300"
                >
                  <Pencil className="w-4 h-4" />
                  {h.editListingBtn}
                </Link>

                <Link
                  href="/host/dashboard"
                  className="flex items-center gap-3 w-full px-5 py-3.5 rounded-xl border border-charcoal/10 text-charcoal font-bold text-sm hover:border-gold hover:text-gold transition-all duration-300"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {h.backToDashboard}
                </Link>
              </div>

              {/* Manage Listing Actions */}
              <PropertyManageActions
                propertyId={property.id}
                currentStatus={property.status}
              />

              {/* Listing Stats */}
              <div className="bg-white rounded-2xl border border-charcoal/5 p-6">
                <h3 className="text-sm font-black uppercase tracking-wider text-charcoal/40 mb-4">
                  {h.listingDetails}
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-charcoal/50">
                      {h.propertyId}
                    </span>
                    <span className="text-xs font-mono text-charcoal/40 bg-offwhite px-2 py-1 rounded">
                      {property.id.slice(0, 8)}…
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-charcoal/50">
                      {h.listedDate}
                    </span>
                    <span className="text-sm font-medium text-charcoal">
                      {createdDate}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-charcoal/50">
                      {h.totalImages}
                    </span>
                    <span className="text-sm font-medium text-charcoal">
                      {property.images.length}
                    </span>
                  </div>
                  {property.amenities && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-charcoal/50">
                        {h.amenities}
                      </span>
                      <span className="text-sm font-medium text-charcoal">
                        {property.amenities.length}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
