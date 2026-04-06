"use client";

import { useState, useCallback, useRef, type DragEvent, type ChangeEvent } from "react";
import { uploadPassport, checkVerificationStatus, type PassportStatus } from "@/app/actions/passport";
import { useTranslations } from "next-intl";

// ─── Props ─────────────────────────────────────────────────────

interface PassportVerificationModalProps {
  /** Initial status fetched server-side to avoid flash */
  initialStatus: PassportStatus;
  /** Called when user closes the modal */
  onClose: () => void;
}

// ─── Constants ─────────────────────────────────────────────────

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

// ─── Component ─────────────────────────────────────────────────

export default function PassportVerificationModal({
  initialStatus,
  onClose,
}: PassportVerificationModalProps) {
  const t = useTranslations("passportModal");
  const [status, setStatus] = useState<PassportStatus>(initialStatus);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // If verified, don't render the modal at all
  if (status === "verified") return null;

  // ── File validation ────────────────────────────────────────

  const validateFile = (f: File): string | null => {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      return t("onlyAccepted");
    }
    if (f.size > MAX_SIZE_BYTES) {
      return t("fileSizeLimit", { size: String(MAX_SIZE_MB) });
    }
    return null;
  };

  // ── Handlers ───────────────────────────────────────────────

  const handleFileSelect = (f: File) => {
    setError(null);
    const validationError = validateFile(f);
    if (validationError) {
      setError(validationError);
      setFile(null);
      return;
    }
    setFile(f);
  };

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) handleFileSelect(selected);
  };

  const handleUpload = async () => {
    if (!file) return;
    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("passport", file);

      const result = await uploadPassport(formData);

      if (!result.success) {
        setError(result.error || t("uploadFailed"));
        setUploading(false);
        return;
      }

      // Re-check status from server
      const newStatus = await checkVerificationStatus();
      setStatus(newStatus);
      setFile(null);
    } catch {
      setError(t("unexpectedError"));
    } finally {
      setUploading(false);
    }
  };

  // ── Utility: format file size ──────────────────────────────

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // ── Utility: get file icon ─────────────────────────────────

  const getFileIcon = (type: string): string => {
    if (type === "application/pdf") return "📄";
    return "🖼️";
  };

  // ─── Render: Upload State ──────────────────────────────────

  if (status === "none") {
    return (
      <div style={styles.overlay} onClick={onClose}>
        <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
          {/* Close button */}
          <button
            style={styles.closeBtn}
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>

          {/* Shield icon */}
          <div style={styles.iconWrapper}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C5A059" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>

          {/* Headings */}
          <h2 style={styles.heading}>{t("verifyIdentity")}</h2>
          <p style={styles.subheading}>
            {t("uaeLawRequires")}
          </p>

          {/* Drop zone */}
          <div
            style={{
              ...styles.dropZone,
              ...(isDragging ? styles.dropZoneActive : {}),
              ...(file ? styles.dropZoneHasFile : {}),
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleInputChange}
              style={{ display: "none" }}
              id="passport-file-input"
            />

            {file ? (
              <div style={styles.filePreview}>
                <span style={styles.fileIcon}>{getFileIcon(file.type)}</span>
                <div style={styles.fileInfo}>
                  <span style={styles.fileName}>{file.name}</span>
                  <span style={styles.fileSize}>{formatSize(file.size)}</span>
                </div>
                <button
                  style={styles.removeFileBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setError(null);
                  }}
                  aria-label="Remove file"
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <div style={styles.uploadIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={isDragging ? "#C5A059" : "#999"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <p style={styles.dropText}>
                  {isDragging ? t("dropFileHere") : t("dragAndDrop")}
                </p>
                <p style={styles.dropHint}>
                  {t("fileTypes", { size: String(MAX_SIZE_MB) })}
                </p>
              </>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div style={styles.errorBox}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Upload button */}
          <button
            style={{
              ...styles.uploadBtn,
              ...((!file || uploading) ? styles.uploadBtnDisabled : {}),
            }}
            onClick={handleUpload}
            disabled={!file || uploading}
            id="passport-upload-btn"
          >
            {uploading ? (
              <span style={styles.spinnerWrap}>
                <span style={styles.spinner} />
                {t("uploading")}
              </span>
            ) : (
              t("uploadDocument")
            )}
          </button>

          {/* Privacy note */}
          <p style={styles.privacyNote}>
            🔒 {t("privacyNote")}
          </p>
        </div>
      </div>
    );
  }

  // ─── Render: Pending State ─────────────────────────────────

  if (status === "pending") {
    return (
      <div style={styles.overlay} onClick={onClose}>
        <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
          {/* Close button */}
          <button
            style={styles.closeBtn}
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>

          {/* Clock icon */}
          <div style={styles.iconWrapper}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#C5A059" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>

          {/* Status badge */}
          <div style={styles.pendingBadge}>{t("underReview")}</div>

          {/* Headings */}
          <h2 style={styles.heading}>{t("documentUnderReview")}</h2>
          <p style={styles.subheading}>
            {t("reviewNotice")}
          </p>

          {/* Timeline */}
          <div style={styles.timeline}>
            <div style={styles.timelineItem}>
              <div style={styles.timelineDotDone} />
              <span style={styles.timelineText}>{t("documentUploaded")}</span>
              <span style={styles.timelineCheck}>✓</span>
            </div>
            <div style={styles.timelineConnector} />
            <div style={styles.timelineItem}>
              <div style={styles.timelineDotActive}>
                <div style={styles.timelinePulse} />
              </div>
              <span style={styles.timelineText}>{t("adminReviewInProgress")}</span>
            </div>
            <div style={styles.timelineConnector} />
            <div style={styles.timelineItem}>
              <div style={styles.timelineDotPending} />
              <span style={styles.timelineTextMuted}>{t("verificationComplete")}</span>
            </div>
          </div>

          {/* Close button */}
          <button
            style={styles.closeModalBtn}
            onClick={onClose}
            id="passport-close-btn"
          >
            {t("gotIt")}
          </button>
        </div>
      </div>
    );
  }

  return null;
}

// ─── Styles ─────────────────────────────────────────────────────
// Using CSS-in-JS objects to keep the component self-contained.

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    backdropFilter: "blur(4px)",
    WebkitBackdropFilter: "blur(4px)",
    animation: "fadeIn 200ms ease-out",
  },

  modal: {
    position: "relative",
    width: "100%",
    maxWidth: "460px",
    margin: "16px",
    padding: "40px 32px 32px",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(197, 160, 89, 0.08)",
    animation: "slideUp 300ms cubic-bezier(0.4, 0, 0.2, 1)",
    textAlign: "center",
  },

  closeBtn: {
    position: "absolute",
    top: "16px",
    right: "16px",
    width: "32px",
    height: "32px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "16px",
    color: "#999",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 200ms ease",
  },

  iconWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "80px",
    height: "80px",
    margin: "0 auto 20px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, rgba(197,160,89,0.08) 0%, rgba(197,160,89,0.15) 100%)",
  },

  heading: {
    fontSize: "22px",
    fontWeight: 700,
    color: "#1A1A1A",
    margin: "0 0 8px",
    fontFamily: "'DM Sans', system-ui, sans-serif",
    lineHeight: "1.3",
  },

  subheading: {
    fontSize: "14px",
    color: "#6b6b6b",
    margin: "0 0 24px",
    lineHeight: "1.6",
  },

  // ── Drop Zone ──
  dropZone: {
    position: "relative",
    padding: "32px 24px",
    border: "2px dashed #ddd",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 250ms cubic-bezier(0.4, 0, 0.2, 1)",
    backgroundColor: "#fafafa",
    marginBottom: "16px",
  },

  dropZoneActive: {
    borderColor: "#C5A059",
    backgroundColor: "rgba(197, 160, 89, 0.04)",
    transform: "scale(1.01)",
  },

  dropZoneHasFile: {
    borderColor: "#C5A059",
    borderStyle: "solid",
    backgroundColor: "rgba(197, 160, 89, 0.03)",
    padding: "16px 20px",
  },

  uploadIcon: {
    marginBottom: "12px",
    display: "flex",
    justifyContent: "center",
  },

  dropText: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#333",
    margin: "0 0 4px",
  },

  dropHint: {
    fontSize: "12px",
    color: "#999",
    margin: 0,
  },

  // ── File Preview ──
  filePreview: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    textAlign: "left",
  },

  fileIcon: {
    fontSize: "28px",
    flexShrink: 0,
  },

  fileInfo: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },

  fileName: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#1A1A1A",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  fileSize: {
    fontSize: "12px",
    color: "#999",
  },

  removeFileBtn: {
    width: "28px",
    height: "28px",
    border: "none",
    background: "rgba(0,0,0,0.05)",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    color: "#666",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "background 200ms",
  },

  // ── Error ──
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 14px",
    backgroundColor: "rgba(239, 68, 68, 0.06)",
    border: "1px solid rgba(239, 68, 68, 0.15)",
    borderRadius: "8px",
    marginBottom: "16px",
    fontSize: "13px",
    color: "#dc2626",
    textAlign: "left",
  },

  // ── Upload Button ──
  uploadBtn: {
    width: "100%",
    padding: "14px 24px",
    border: "none",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #C5A059 0%, #A37F3F 100%)",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 4px 14px -3px rgba(197, 160, 89, 0.4)",
    marginBottom: "16px",
  },

  uploadBtnDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
    boxShadow: "none",
  },

  spinnerWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },

  spinner: {
    display: "inline-block",
    width: "16px",
    height: "16px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "spin 600ms linear infinite",
  },

  // ── Privacy Note ──
  privacyNote: {
    fontSize: "11px",
    color: "#aaa",
    margin: 0,
    lineHeight: "1.5",
  },

  // ── Pending State ──
  pendingBadge: {
    display: "inline-block",
    padding: "4px 14px",
    fontSize: "12px",
    fontWeight: 600,
    color: "#C5A059",
    backgroundColor: "rgba(197, 160, 89, 0.1)",
    borderRadius: "20px",
    letterSpacing: "0.5px",
    marginBottom: "16px",
  },

  timeline: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    padding: "20px 32px",
    margin: "0 0 24px",
    backgroundColor: "#fafaf8",
    borderRadius: "12px",
    textAlign: "left",
  },

  timelineItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    width: "100%",
  },

  timelineDotDone: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    backgroundColor: "#22c55e",
    flexShrink: 0,
  },

  timelineDotActive: {
    position: "relative",
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    backgroundColor: "#C5A059",
    flexShrink: 0,
  },

  timelinePulse: {
    position: "absolute",
    inset: "-4px",
    borderRadius: "50%",
    border: "2px solid rgba(197, 160, 89, 0.3)",
    animation: "pulse 2s ease-in-out infinite",
  },

  timelineDotPending: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    backgroundColor: "#ddd",
    flexShrink: 0,
  },

  timelineConnector: {
    width: "2px",
    height: "20px",
    backgroundColor: "#e5e5e5",
    marginLeft: "5px",
  },

  timelineText: {
    fontSize: "13px",
    fontWeight: 500,
    color: "#333",
    flex: 1,
  },

  timelineTextMuted: {
    fontSize: "13px",
    fontWeight: 500,
    color: "#bbb",
    flex: 1,
  },

  timelineCheck: {
    fontSize: "12px",
    color: "#22c55e",
    fontWeight: 700,
  },

  closeModalBtn: {
    width: "100%",
    padding: "14px 24px",
    border: "1px solid #e5e5e5",
    borderRadius: "10px",
    backgroundColor: "#fff",
    color: "#333",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 200ms ease",
  },
};
