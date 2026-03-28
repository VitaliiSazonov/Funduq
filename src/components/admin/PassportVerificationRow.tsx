"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  verifyPassport,
  rejectPassport,
  getPassportSignedUrl,
  type UserWithPassport,
} from "@/app/actions/admin";
import { Check, X, ExternalLink, Loader2, ChevronDown, ChevronUp } from "lucide-react";

// ─── Props ─────────────────────────────────────────────────────

interface PassportVerificationRowProps {
  user: UserWithPassport;
}

// ─── Component ─────────────────────────────────────────────────

export default function PassportVerificationRow({
  user,
}: PassportVerificationRowProps) {
  const router = useRouter();
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const formattedDate = user.passport_submitted_at
    ? new Date(user.passport_submitted_at).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  // ── Approve ──────────────────────────────────────────────────

  async function handleApprove() {
    setIsApproving(true);
    setError(null);

    const result = await verifyPassport(user.id);

    if (!result.success) {
      setError(result.error || "Failed to approve.");
      setIsApproving(false);
      return;
    }

    router.refresh();
  }

  // ── Reject ───────────────────────────────────────────────────

  async function handleReject() {
    if (!rejectReason.trim()) {
      setError("Please provide a reason for rejection.");
      return;
    }

    setIsRejecting(true);
    setError(null);

    const result = await rejectPassport(user.id, rejectReason.trim());

    if (!result.success) {
      setError(result.error || "Failed to reject.");
      setIsRejecting(false);
      return;
    }

    router.refresh();
  }

  // ── View Document ────────────────────────────────────────────

  async function handleViewDocument() {
    setIsLoadingUrl(true);
    setError(null);

    const { url, error: urlError } = await getPassportSignedUrl(user.id);

    setIsLoadingUrl(false);

    if (urlError || !url) {
      setError(urlError || "Failed to generate document URL.");
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  }

  // ── Render ───────────────────────────────────────────────────

  const busy = isApproving || isRejecting;

  return (
    <>
      <tr style={{ borderBottom: "1px solid rgba(197, 160, 89, 0.07)" }}>
        {/* Guest Name */}
        <td style={cellStyle}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontWeight: 600, color: "#E5E5E5", fontSize: 14 }}>
              {user.full_name || "—"}
            </span>
            <span style={{ fontSize: 12, color: "#8A8A8A" }}>
              {user.email || "No email"}
            </span>
          </div>
        </td>

        {/* Submitted Date */}
        <td style={cellStyle}>
          <span style={{ fontSize: 13, color: "#8A8A8A" }}>
            {formattedDate}
          </span>
        </td>

        {/* Status Badge */}
        <td style={cellStyle}>
          <span style={pendingBadgeStyle}>Pending Review</span>
        </td>

        {/* Actions */}
        <td style={{ ...cellStyle, textAlign: "right" }}>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
            {/* View Document */}
            <button
              onClick={handleViewDocument}
              disabled={isLoadingUrl || busy}
              style={viewBtnStyle}
              title="Opens signed URL in new tab (60s TTL)"
            >
              {isLoadingUrl ? (
                <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                <ExternalLink size={14} />
              )}
              <span>View</span>
            </button>

            {/* Approve */}
            <button
              onClick={handleApprove}
              disabled={busy}
              style={approveBtnStyle}
            >
              {isApproving ? (
                <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                <Check size={14} />
              )}
              <span>Approve</span>
            </button>

            {/* Toggle Reject Form */}
            <button
              onClick={() => setShowRejectForm(!showRejectForm)}
              disabled={busy}
              style={rejectBtnStyle}
            >
              <X size={14} />
              <span>Reject</span>
              {showRejectForm ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
        </td>
      </tr>

      {/* Reject Reason Form (expanded row) */}
      {showRejectForm && (
        <tr style={{ borderBottom: "1px solid rgba(197, 160, 89, 0.07)" }}>
          <td colSpan={4} style={{ padding: "0 16px 16px" }}>
            <div style={rejectFormStyle}>
              <label
                htmlFor={`reject-reason-${user.id}`}
                style={{ fontSize: 12, fontWeight: 600, color: "#8A8A8A", letterSpacing: "0.5px", textTransform: "uppercase" as const }}
              >
                Reason for rejection
              </label>
              <textarea
                id={`reject-reason-${user.id}`}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., Document image is blurry, please re-upload a clear scan…"
                rows={3}
                style={textareaStyle}
              />
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button
                  onClick={() => {
                    setShowRejectForm(false);
                    setRejectReason("");
                    setError(null);
                  }}
                  style={cancelBtnStyle}
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={isRejecting || !rejectReason.trim()}
                  style={{
                    ...confirmRejectBtnStyle,
                    opacity: isRejecting || !rejectReason.trim() ? 0.5 : 1,
                    cursor: isRejecting || !rejectReason.trim() ? "not-allowed" : "pointer",
                  }}
                >
                  {isRejecting ? (
                    <>
                      <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                      Rejecting…
                    </>
                  ) : (
                    "Confirm Rejection"
                  )}
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}

      {/* Error message */}
      {error && (
        <tr>
          <td colSpan={4} style={{ padding: "0 16px 12px" }}>
            <div style={errorStyle}>{error}</div>
          </td>
        </tr>
      )}

      {/* Spinner keyframe (inline for self-contained component) */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

// ─── Styles ─────────────────────────────────────────────────────

const cellStyle: React.CSSProperties = {
  padding: "14px 16px",
  verticalAlign: "middle",
};

const pendingBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "4px 12px",
  fontSize: 11,
  fontWeight: 600,
  color: "#f59e0b",
  backgroundColor: "rgba(245, 158, 11, 0.1)",
  borderRadius: 20,
  letterSpacing: "0.5px",
};

const baseBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "7px 14px",
  fontSize: 13,
  fontWeight: 500,
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
  transition: "all 200ms ease",
  whiteSpace: "nowrap",
};

const viewBtnStyle: React.CSSProperties = {
  ...baseBtnStyle,
  background: "rgba(197, 160, 89, 0.08)",
  color: "#C5A059",
  border: "1px solid rgba(197, 160, 89, 0.15)",
};

const approveBtnStyle: React.CSSProperties = {
  ...baseBtnStyle,
  background: "rgba(34, 197, 94, 0.08)",
  color: "#22c55e",
  border: "1px solid rgba(34, 197, 94, 0.15)",
};

const rejectBtnStyle: React.CSSProperties = {
  ...baseBtnStyle,
  background: "rgba(239, 68, 68, 0.08)",
  color: "#ef4444",
  border: "1px solid rgba(239, 68, 68, 0.15)",
};

const rejectFormStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  padding: 16,
  backgroundColor: "rgba(239, 68, 68, 0.03)",
  border: "1px solid rgba(239, 68, 68, 0.1)",
  borderRadius: 10,
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  backgroundColor: "#1a1a1a",
  border: "1px solid rgba(239, 68, 68, 0.15)",
  borderRadius: 8,
  color: "#E5E5E5",
  fontSize: 13,
  fontFamily: "inherit",
  resize: "vertical",
  outline: "none",
};

const cancelBtnStyle: React.CSSProperties = {
  ...baseBtnStyle,
  background: "transparent",
  color: "#8A8A8A",
  border: "1px solid rgba(197, 160, 89, 0.1)",
};

const confirmRejectBtnStyle: React.CSSProperties = {
  ...baseBtnStyle,
  background: "rgba(239, 68, 68, 0.15)",
  color: "#ef4444",
  border: "1px solid rgba(239, 68, 68, 0.2)",
};

const errorStyle: React.CSSProperties = {
  padding: "8px 14px",
  backgroundColor: "rgba(239, 68, 68, 0.06)",
  border: "1px solid rgba(239, 68, 68, 0.15)",
  borderRadius: 8,
  fontSize: 13,
  color: "#ef4444",
};
