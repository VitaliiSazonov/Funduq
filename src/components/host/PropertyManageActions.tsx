"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  EyeOff,
  Eye,
  Trash2,
  Loader2,
  AlertTriangle,
  X,
} from "lucide-react";
import {
  unpublishProperty,
  republishProperty,
  deleteProperty,
} from "@/app/actions/manageProperty";

interface PropertyManageActionsProps {
  propertyId: string;
  currentStatus: string;
}

export default function PropertyManageActions({
  propertyId,
  currentStatus,
}: PropertyManageActionsProps) {
  const t = useTranslations("host");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isActive = currentStatus === "active";
  const isInactive = currentStatus === "inactive";
  const canToggle = isActive || isInactive;

  // ── Toggle publish/unpublish ──
  const handleTogglePublish = () => {
    setError(null);
    setActionInProgress(isActive ? "unpublish" : "republish");

    startTransition(async () => {
      const result = isActive
        ? await unpublishProperty(propertyId)
        : await republishProperty(propertyId);

      if (result.success) {
        router.refresh();
      } else {
        setError(result.error || "Something went wrong");
      }
      setActionInProgress(null);
    });
  };

  // ── Delete with confirmation ──
  const handleDelete = () => {
    setError(null);
    setActionInProgress("delete");

    startTransition(async () => {
      const result = await deleteProperty(propertyId);

      if (result.success) {
        router.push("/host/dashboard");
      } else {
        setError(result.error || "Something went wrong");
        setActionInProgress(null);
        setShowDeleteModal(false);
      }
    });
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-charcoal/5 p-6 space-y-3">
        <h3 className="text-sm font-black uppercase tracking-wider text-charcoal/40 mb-4">
          {t("manageListing")}
        </h3>

        {/* Error display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Toggle publish/unpublish */}
        {canToggle && (
          <button
            onClick={handleTogglePublish}
            disabled={isPending}
            className={`flex items-center justify-center gap-3 w-full px-5 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              isActive
                ? "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            {actionInProgress === "unpublish" || actionInProgress === "republish" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isActive ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            {isActive ? t("unpublish") : t("republish")}
          </button>
        )}

        {/* Delete button */}
        <button
          onClick={() => setShowDeleteModal(true)}
          disabled={isPending}
          className="flex items-center justify-center gap-3 w-full px-5 py-3.5 rounded-xl border border-red-200 bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 hover:border-red-300 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-4 h-4" />
          {t("deleteListing")}
        </button>
      </div>

      {/* ─── Delete Confirmation Modal ─── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm"
            onClick={() => !isPending && setShowDeleteModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-3xl border border-charcoal/10 p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Close button */}
            <button
              onClick={() => !isPending && setShowDeleteModal(false)}
              disabled={isPending}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-offwhite flex items-center justify-center text-charcoal/40 hover:text-charcoal hover:bg-charcoal/10 transition-colors cursor-pointer disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Warning icon */}
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>

            {/* Text */}
            <h3 className="text-xl font-black display-font text-charcoal text-center mb-2">
              {t("deleteConfirmTitle")}
            </h3>
            <p className="text-sm text-charcoal/50 text-center mb-8 max-w-xs mx-auto leading-relaxed">
              {t("deleteConfirmDesc")}
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex items-center justify-center gap-3 w-full px-5 py-4 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionInProgress === "delete" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {actionInProgress === "delete"
                  ? t("deleting")
                  : t("deleteConfirm")}
              </button>

              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isPending}
                className="flex items-center justify-center w-full px-5 py-4 rounded-xl border border-charcoal/10 text-charcoal font-bold text-sm hover:border-charcoal/30 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
