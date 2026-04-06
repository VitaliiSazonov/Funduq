"use client";

import { useState, useTransition } from "react";
import { Pencil, Save, Loader2, Check } from "lucide-react";
import { useTranslations } from "next-intl";

interface ProfileFormProps {
  initialName: string;
  updateProfileAction: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
}

export default function ProfileForm({ initialName, updateProfileAction }: ProfileFormProps) {
  const t = useTranslations("profileForm");
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateProfileAction(formData);
      if (result.success) {
        setFeedback({ type: "success", message: t("profileUpdated") });
        setEditing(false);
        setName(formData.get("full_name") as string);
      } else {
        setFeedback({ type: "error", message: result.error || t("updateFailed") });
      }
      setTimeout(() => setFeedback(null), 4000);
    });
  }

  return (
    <>
      {/* Feedback toast */}
      {feedback && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-semibold shadow-xl animate-[fadeSlideIn_0.3s_ease-out] ${
            feedback.type === "success"
              ? "bg-green-900/90 text-green-200 border border-green-700/40"
              : "bg-red-900/90 text-red-200 border border-red-700/40"
          }`}
        >
          {feedback.type === "success" && <Check className="w-4 h-4" />}
          {feedback.message}
        </div>
      )}

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xs font-black text-white/30 uppercase tracking-[0.2em]">
            {t("personalInfo")}
          </h2>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.05] border border-white/10 text-white/60 text-xs font-bold uppercase tracking-wider hover:border-[#C9A84C]/40 hover:text-[#C9A84C] transition-all duration-300 cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              {t("edit")}
            </button>
          )}
        </div>

        {editing ? (
          <form action={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="full_name"
                className="block text-[11px] font-bold text-white/40 uppercase tracking-widest mb-2"
              >
                {t("fullName")}
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                defaultValue={name}
                required
                minLength={2}
                maxLength={100}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-medium placeholder:text-white/20 focus:outline-none focus:border-[#C9A84C]/50 focus:ring-1 focus:ring-[#C9A84C]/20 transition-all"
                placeholder={t("enterFullName")}
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#C9A84C] text-black text-xs font-black uppercase tracking-wider hover:bg-[#d4b85c] transition-all duration-300 disabled:opacity-50 cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isPending ? t("saving") : t("saveChanges")}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-5 py-3 rounded-full bg-white/[0.05] border border-white/10 text-white/50 text-xs font-bold uppercase tracking-wider hover:text-white/80 transition-all cursor-pointer"
              >
                {t("cancel")}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <span className="block text-[11px] font-bold text-white/30 uppercase tracking-widest mb-1">
                {t("fullName")}
              </span>
              <span className="text-white font-semibold text-lg">
                {name || t("notSet")}
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
