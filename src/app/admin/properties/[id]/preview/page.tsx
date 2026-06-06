import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  MapPin,
  BedDouble,
  Bath,
  Users,
  BadgeCheck,
  Clock,
  Ban,
  PartyPopper,
  PawPrint,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MapPinned,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { buildVillaUrl } from "@/lib/utils/slugify";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminPropertyPreviewPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = createAdminClient();

  const { data: property, error } = await supabase
    .from("properties")
    .select(
      `
      *,
      host:profiles!properties_owner_id_fkey (
        full_name,
        avatar_url,
        verified,
        created_at,
        email,
        phone
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !property) {
    notFound();
  }

  // Build images list from storage
  const images: { url: string; order: number }[] = [];
  const { data: storageFiles } = await supabase.storage
    .from("properties-images")
    .list(id, { limit: 20, sortBy: { column: "name", order: "asc" } });

  if (storageFiles && storageFiles.length > 0) {
    for (let i = 0; i < storageFiles.length; i++) {
      const file = storageFiles[i];
      if (!file.name || file.name.startsWith(".")) continue;
      const { data: urlData } = supabase.storage
        .from("properties-images")
        .getPublicUrl(`${id}/${file.name}`);
      if (urlData?.publicUrl) {
        images.push({ url: urlData.publicUrl, order: i });
      }
    }
  }

  if (images.length === 0 && property.gallery_urls?.length > 0) {
    property.gallery_urls.forEach((url: string, i: number) => {
      images.push({ url, order: i });
    });
  }

  if (images.length === 0 && property.main_image_url) {
    images.push({ url: property.main_image_url, order: 0 });
  }

  const hostRaw = property.host;
  const host = Array.isArray(hostRaw) ? hostRaw[0] : hostRaw;

  const memberSince = host?.created_at
    ? format(parseISO(host.created_at), "MMMM yyyy")
    : null;

  const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    active: { label: "Active", color: "#22c55e", bg: "rgba(34,197,94,0.15)", icon: CheckCircle },
    pending_review: { label: "Pending Review", color: "#f59e0b", bg: "rgba(245,158,11,0.15)", icon: AlertTriangle },
    suspended: { label: "Suspended", color: "#ef4444", bg: "rgba(239,68,68,0.15)", icon: XCircle },
    inactive: { label: "Inactive", color: "#9ca3af", bg: "rgba(156,163,175,0.15)", icon: XCircle },
  };

  const statusCfg = statusConfig[property.status] || statusConfig.inactive;
  const StatusIcon = statusCfg.icon;

  const publicUrl = buildVillaUrl(property.id, property.title ?? "");

  return (
    <div style={{ minHeight: "100vh", background: "#0F0F0F", color: "#E5E5E5" }}>
      {/* ── Admin Preview Banner ── */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(197,160,89,0.1) 100%)",
          borderBottom: "1px solid rgba(245,158,11,0.3)",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(12px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Eye size={18} style={{ color: "#f59e0b" }} />
          <span style={{ fontWeight: 700, fontSize: 14, color: "#f59e0b" }}>
            Admin Preview
          </span>
          <span style={{ fontSize: 13, color: "#A0A0A0" }}>
            — This listing is not yet published to the public
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "3px 10px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              background: statusCfg.bg,
              color: statusCfg.color,
              border: `1px solid ${statusCfg.color}30`,
            }}
          >
            <StatusIcon size={11} />
            {statusCfg.label}
          </span>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <Link
            href="/admin/properties"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              background: "rgba(197,160,89,0.1)",
              color: "#C5A059",
              textDecoration: "none",
              border: "1px solid rgba(197,160,89,0.2)",
              transition: "background 0.15s",
            }}
          >
            <ArrowLeft size={14} />
            Back to Properties
          </Link>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px 80px" }}>

        {/* ── Gallery ── */}
        {images.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: images.length === 1 ? "1fr" : "2fr 1fr",
              gap: 8,
              borderRadius: 16,
              overflow: "hidden",
              maxHeight: 480,
            }}
          >
            <div style={{ position: "relative", height: 480 }}>
              <Image
                src={images[0].url}
                alt={property.title || "Property"}
                fill
                style={{ objectFit: "cover" }}
                sizes="(max-width: 768px) 100vw, 66vw"
                priority
              />
            </div>
            {images.length > 1 && (
              <div style={{ display: "grid", gridTemplateRows: images.length > 2 ? "1fr 1fr" : "1fr", gap: 8 }}>
                {images.slice(1, 3).map((img, idx) => (
                  <div key={idx} style={{ position: "relative" }}>
                    <Image
                      src={img.url}
                      alt={`${property.title || "Property"} ${idx + 2}`}
                      fill
                      style={{ objectFit: "cover" }}
                      sizes="34vw"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {images.length === 0 && (
          <div
            style={{
              height: 300,
              background: "#1A1A1A",
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(197,160,89,0.1)",
            }}
          >
            <span style={{ fontSize: 48 }}>🏠</span>
          </div>
        )}

        {/* ── Two-column layout ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 320px",
            gap: 32,
            marginTop: 32,
          }}
        >
          {/* LEFT COLUMN */}
          <div style={{ minWidth: 0 }}>
            {/* Title & Location */}
            <div style={{ marginBottom: 24 }}>
              <h1
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  color: "#F5F5F5",
                  margin: "0 0 8px",
                  lineHeight: 1.2,
                }}
              >
                {property.title || "Untitled Property"}
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#8A8A8A", marginBottom: 12 }}>
                <MapPin size={15} style={{ color: "#C5A059" }} />
                <span style={{ fontSize: 14, fontWeight: 500 }}>
                  {property.location_district ?? "—"}, {property.location_emirate ?? "—"}
                </span>
              </div>

              {/* Stats Row */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, color: "#A0A0A0" }}>
                  <BedDouble size={15} style={{ color: "#C5A059" }} />
                  {property.bedrooms ?? 0} Bedrooms
                </span>
                <span style={{ color: "#3A3A3A" }}>·</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, color: "#A0A0A0" }}>
                  <Bath size={15} style={{ color: "#C5A059" }} />
                  {property.bathrooms ?? 0} Bathrooms
                </span>
                <span style={{ color: "#3A3A3A" }}>·</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, color: "#A0A0A0" }}>
                  <Users size={15} style={{ color: "#C5A059" }} />
                  Up to {property.max_guests ?? 0} guests
                </span>
                {property.type && (
                  <>
                    <span style={{ color: "#3A3A3A" }}>·</span>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 10px",
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 700,
                        background: "rgba(197,160,89,0.12)",
                        color: "#C5A059",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {property.type}
                    </span>
                  </>
                )}
              </div>
            </div>

            <hr style={{ border: "none", borderTop: "1px solid rgba(197,160,89,0.08)", margin: "0 0 24px" }} />

            {/* Host Card */}
            <div
              style={{
                background: "#161616",
                border: "1px solid rgba(197,160,89,0.1)",
                borderRadius: 16,
                padding: "20px 24px",
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "2px solid rgba(197,160,89,0.2)",
                  flexShrink: 0,
                  background: "#1A1A1A",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {host?.avatar_url ? (
                  <Image src={host.avatar_url} alt={host.full_name || "Host"} width={60} height={60} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                ) : (
                  <span style={{ fontSize: 22, fontWeight: 800, color: "#C5A059" }}>
                    {(host?.full_name || "H").charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "#E5E5E5" }}>
                    Hosted by {host?.full_name || "Unknown"}
                  </span>
                  {host?.verified && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "2px 8px",
                        borderRadius: 20,
                        fontSize: 10,
                        fontWeight: 700,
                        background: "rgba(59,130,246,0.15)",
                        color: "#60a5fa",
                        textTransform: "uppercase",
                      }}
                    >
                      <BadgeCheck size={10} /> Verified
                    </span>
                  )}
                </div>
                {memberSince && (
                  <p style={{ fontSize: 12, color: "#6A6A6A", margin: 0 }}>
                    Member since {memberSince}
                  </p>
                )}
                {host?.phone && (
                  <p style={{ fontSize: 12, color: "#8A8A8A", margin: "4px 0 0" }}>
                    📞 {host.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            {property.description && (
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#E5E5E5", margin: "0 0 12px" }}>
                  About this property
                </h2>
                <p
                  style={{
                    fontSize: 14,
                    lineHeight: 1.8,
                    color: "#A0A0A0",
                    margin: 0,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {property.description}
                </p>
              </div>
            )}

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#E5E5E5", margin: "0 0 14px" }}>
                  Amenities
                </h2>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                    gap: 10,
                  }}
                >
                  {property.amenities.map((amenity: string, i: number) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 12px",
                        background: "#161616",
                        border: "1px solid rgba(197,160,89,0.08)",
                        borderRadius: 8,
                        fontSize: 13,
                        color: "#C0C0C0",
                      }}
                    >
                      <span style={{ color: "#C5A059", fontSize: 11 }}>✓</span>
                      {amenity}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location */}
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#E5E5E5", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
                <MapPinned size={18} style={{ color: "#C5A059" }} /> Location
              </h2>
              <div
                style={{
                  background: "#161616",
                  border: "1px solid rgba(197,160,89,0.08)",
                  borderRadius: 12,
                  padding: 24,
                  textAlign: "center",
                }}
              >
                <MapPin size={24} style={{ color: "#C5A059", marginBottom: 8 }} />
                <p style={{ fontSize: 15, fontWeight: 600, color: "#E5E5E5", margin: "0 0 4px" }}>
                  {property.location_district}, {property.location_emirate}
                </p>
                <p style={{ fontSize: 12, color: "#6A6A6A", margin: 0 }}>
                  {property.location_country || "UAE"}
                </p>
              </div>
            </div>

            {/* House Rules */}
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#E5E5E5", margin: "0 0 14px" }}>
                House Rules
              </h2>
              <div
                style={{
                  background: "#161616",
                  border: "1px solid rgba(197,160,89,0.08)",
                  borderRadius: 12,
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                {[
                  { icon: Clock, label: "Check-in", value: "After 3:00 PM" },
                  { icon: Clock, label: "Check-out", value: "Before 12:00 PM" },
                  { icon: Ban, label: "Smoking", value: "Not allowed" },
                  { icon: PartyPopper, label: "Parties", value: property.events_allowed ? "Allowed" : "Not allowed" },
                  { icon: PawPrint, label: "Pets", value: "Not allowed" },
                ].map((rule) => (
                  <div key={rule.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: "rgba(197,160,89,0.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <rule.icon size={15} style={{ color: "#C5A059" }} />
                    </div>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#E5E5E5" }}>{rule.label}</span>
                      <span style={{ fontSize: 13, color: "#6A6A6A" }}> — {rule.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN — Pricing & Info Card */}
          <div style={{ position: "sticky", top: 72, height: "fit-content" }}>
            {/* Price Card */}
            <div
              style={{
                background: "#161616",
                border: "1px solid rgba(197,160,89,0.15)",
                borderRadius: 16,
                padding: 24,
                marginBottom: 16,
              }}
            >
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: "#6A6A6A", marginBottom: 4, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>
                  Price Range
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#C5A059" }}>
                  {property.price_min
                    ? `AED ${new Intl.NumberFormat().format(property.price_min)}`
                    : "—"}
                  {property.price_max && property.price_min !== property.price_max && (
                    <span style={{ fontSize: 18, color: "#8A8A8A", fontWeight: 600 }}>
                      {" "}– {new Intl.NumberFormat().format(property.price_max)}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "#6A6A6A", marginTop: 2 }}>per night</div>
              </div>

              <hr style={{ border: "none", borderTop: "1px solid rgba(197,160,89,0.08)", margin: "0 0 16px" }} />

              {/* Quick Info */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Property ID", value: property.id.slice(0, 8) + "..." },
                  { label: "Status", value: statusCfg.label, color: statusCfg.color },
                  { label: "Type", value: property.type || "—" },
                  { label: "Bedrooms", value: property.bedrooms ?? "—" },
                  { label: "Bathrooms", value: property.bathrooms ?? "—" },
                  { label: "Max guests", value: property.max_guests ?? "—" },
                  {
                    label: "Submitted",
                    value: property.created_at
                      ? new Date(property.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—",
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: "#6A6A6A" }}>{row.label}</span>
                    <span style={{ color: (row as any).color || "#C0C0C0", fontWeight: 600 }}>
                      {String(row.value)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Host Contact */}
              {(host?.phone || host?.email) && (
                <>
                  <hr style={{ border: "none", borderTop: "1px solid rgba(197,160,89,0.08)", margin: "16px 0" }} />
                  <div style={{ fontSize: 12, color: "#6A6A6A", marginBottom: 8, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>
                    Host Contact
                  </div>
                  {host?.phone && (
                    <p style={{ fontSize: 13, color: "#A0A0A0", margin: "0 0 4px" }}>📞 {host.phone}</p>
                  )}
                  {host?.email && (
                    <p style={{ fontSize: 13, color: "#A0A0A0", margin: 0 }}>✉️ {host.email}</p>
                  )}
                </>
              )}
            </div>

            {/* Action note */}
            <div
              style={{
                background: "rgba(245,158,11,0.06)",
                border: "1px solid rgba(245,158,11,0.15)",
                borderRadius: 12,
                padding: 14,
                fontSize: 12,
                color: "#A0A0A0",
                lineHeight: 1.6,
              }}
            >
              <AlertTriangle size={13} style={{ color: "#f59e0b", display: "inline", marginRight: 6 }} />
              This is an <strong style={{ color: "#E5E5E5" }}>admin-only preview</strong>. 
              The listing is not visible to guests until approved.
              Go back to approve or suspend this property.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
