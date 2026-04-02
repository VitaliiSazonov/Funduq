"use client";

import React, { useState, useTransition } from "react";
import { approveProperty, suspendProperty, toggleSignatureProperty } from "@/app/actions/admin";
import type { PropertyWithHost } from "@/app/actions/admin";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  Ban,
  ExternalLink,
  Loader2,
  Star,
} from "lucide-react";

interface PropertyModerationRowProps {
  property: PropertyWithHost;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; color: string; label: string }> = {
    active: { bg: "rgba(34, 197, 94, 0.12)", color: "#22c55e", label: "Active" },
    pending_review: { bg: "rgba(245, 158, 11, 0.12)", color: "#f59e0b", label: "Pending" },
    suspended: { bg: "rgba(239, 68, 68, 0.12)", color: "#ef4444", label: "Suspended" },
    inactive: { bg: "rgba(156, 163, 175, 0.12)", color: "#9ca3af", label: "Inactive" },
    archived: { bg: "rgba(156, 163, 175, 0.12)", color: "#9ca3af", label: "Archived" },
  };

  const c = config[status] || config.inactive;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 12px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        background: c.bg,
        color: c.color,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: c.color,
        }}
      />
      {c.label}
    </span>
  );
}

export default function PropertyModerationRow({
  property,
}: PropertyModerationRowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [actionType, setActionType] = useState<"approve" | "suspend" | "signature" | null>(null);

  const handleApprove = () => {
    setActionType("approve");
    startTransition(async () => {
      const result = await approveProperty(property.id);
      if (!result.success) {
        console.error("Approve failed:", result.error);
      }
      router.refresh();
      setActionType(null);
    });
  };

  const handleSuspend = () => {
    setActionType("suspend");
    startTransition(async () => {
      const result = await suspendProperty(property.id);
      if (!result.success) {
        console.error("Suspend failed:", result.error);
      }
      router.refresh();
      setActionType(null);
    });
  };

  const handleToggleSignature = () => {
    setActionType("signature");
    startTransition(async () => {
      const result = await toggleSignatureProperty(
        property.id,
        !(property as any).is_signature
      );
      if (!result.success) {
        console.error("Signature toggle failed:", result.error);
      }
      router.refresh();
      setActionType(null);
    });
  };

  return (
    <tr data-testid="admin-property-row" style={rowStyle}>
      {/* Thumbnail */}
      <td style={cellStyle}>
        <div style={thumbnailContainer}>
          {property.main_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={property.main_image_url}
              alt={property.title}
              style={thumbnailImg}
            />
          ) : (
            <div style={thumbnailPlaceholder}>
              <span style={{ fontSize: 18 }}>🏠</span>
            </div>
          )}
        </div>
      </td>

      {/* Title & Location */}
      <td style={cellStyle}>
        <p style={titleText}>{property.title}</p>
        <p style={locationText}>
          {property.location_district}, {property.location_emirate}
        </p>
      </td>

      {/* Host */}
      <td style={cellStyle}>
        <p style={hostText}>{property.owner?.full_name || "Unknown"}</p>
      </td>

      {/* Submitted */}
      <td style={cellStyle}>
        <p style={dateText}>
          {new Date(property.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      </td>

      {/* Status */}
      <td style={cellStyle}>
        <StatusBadge status={property.status} />
      </td>

      {/* Actions */}
      <td style={{ ...cellStyle, textAlign: "right" }}>
        <div style={actionsContainer}>
          {/* Signature Collection Toggle */}
          <button
            onClick={handleToggleSignature}
            disabled={isPending}
            style={{
              ...btnBase,
              background: (property as any).is_signature
                ? "rgba(197, 160, 89, 0.15)"
                : "rgba(197, 160, 89, 0.06)",
              color: (property as any).is_signature ? "#C5A059" : "#6A6A6A",
            }}
            title={(property as any).is_signature ? "Remove from Signature Collection" : "Add to Signature Collection"}
          >
            {isPending && actionType === "signature" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Star
                size={14}
                fill={(property as any).is_signature ? "#C5A059" : "none"}
              />
            )}
          </button>

          {property.status !== "active" && (
            <button
              onClick={handleApprove}
              disabled={isPending}
              style={approveBtn}
              title="Approve"
            >
              {isPending && actionType === "approve" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCircle size={14} />
              )}
              <span>Approve</span>
            </button>
          )}

          {property.status !== "suspended" && (
            <button
              onClick={handleSuspend}
              disabled={isPending}
              style={suspendBtn}
              title="Suspend"
            >
              {isPending && actionType === "suspend" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Ban size={14} />
              )}
              <span>Suspend</span>
            </button>
          )}

          <a
            href={`/villas/${property.id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={viewBtn}
            title="View listing"
          >
            <ExternalLink size={14} />
          </a>
        </div>
      </td>
    </tr>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const rowStyle: React.CSSProperties = {
  borderBottom: "1px solid rgba(197, 160, 89, 0.06)",
  transition: "background 0.15s",
};

const cellStyle: React.CSSProperties = {
  padding: "14px 16px",
  verticalAlign: "middle",
};

const thumbnailContainer: React.CSSProperties = {
  width: 56,
  height: 40,
  borderRadius: 6,
  overflow: "hidden",
  background: "#1A1A1A",
};

const thumbnailImg: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const thumbnailPlaceholder: React.CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#1A1A1A",
};

const titleText: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "#E5E5E5",
  margin: "0 0 2px",
};

const locationText: React.CSSProperties = {
  fontSize: 12,
  color: "#8A8A8A",
  margin: 0,
};

const hostText: React.CSSProperties = {
  fontSize: 14,
  color: "#B5B5B5",
  margin: 0,
};

const dateText: React.CSSProperties = {
  fontSize: 13,
  color: "#8A8A8A",
  margin: 0,
};

const actionsContainer: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  justifyContent: "flex-end",
};

const btnBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 14px",
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  border: "none",
  transition: "all 0.15s",
};

const approveBtn: React.CSSProperties = {
  ...btnBase,
  background: "rgba(34, 197, 94, 0.1)",
  color: "#22c55e",
};

const suspendBtn: React.CSSProperties = {
  ...btnBase,
  background: "rgba(239, 68, 68, 0.1)",
  color: "#ef4444",
};

const viewBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 32,
  height: 32,
  borderRadius: 6,
  background: "rgba(197, 160, 89, 0.08)",
  color: "#C5A059",
  textDecoration: "none",
  transition: "background 0.15s",
};
