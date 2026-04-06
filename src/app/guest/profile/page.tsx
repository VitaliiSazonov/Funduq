import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkVerificationStatus, type PassportStatus } from "@/app/actions/passport";
import { getHostLocale, getHostMessages } from "@/lib/getHostLocale";
import ProfileForm from "./ProfileForm";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Shield,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { NextIntlClientProvider } from "next-intl";

export const metadata = {
  title: "My Profile | Funduq",
  description: "View and manage your guest profile on Funduq.",
};

// ─── Server action: update profile name ────────────────────────
async function updateProfile(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated." };

  const fullName = (formData.get("full_name") as string)?.trim();
  if (!fullName || fullName.length < 2) {
    return { success: false, error: "Name must be at least 2 characters." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", user.id);

  if (error) {
    console.error("[Profile] Update error:", error);
    return { success: false, error: "Failed to update profile." };
  }

  return { success: true };
}

// ─── Passport status config ───────────────────────────────────
function passportConfig(status: PassportStatus, t: Record<string, string>) {
  const map: Record<
    PassportStatus,
    {
      label: string;
      description: string;
      bg: string;
      textColor: string;
      icon: React.ReactNode;
      actionLabel?: string;
    }
  > = {
    verified: {
      label: t.verified,
      description: t.verifiedDesc,
      bg: "bg-green-500/10 border-green-500/20",
      textColor: "text-green-400",
      icon: <CheckCircle2 className="w-5 h-5 text-green-400" />,
    },
    pending: {
      label: t.pendingReview,
      description: t.pendingDesc,
      bg: "bg-amber-500/10 border-amber-500/20",
      textColor: "text-amber-400",
      icon: <Clock className="w-5 h-5 text-amber-400" />,
    },
    none: {
      label: t.notSubmitted,
      description: t.notSubmittedDesc,
      bg: "bg-white/[0.03] border-white/[0.06]",
      textColor: "text-white/40",
      icon: <AlertTriangle className="w-5 h-5 text-white/30" />,
      actionLabel: t.submitPassport,
    },
  };
  return map[status];
}

export default async function GuestProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // ── Load translations ──
  const locale = await getHostLocale();
  const messages = await getHostMessages(locale);
  const t = messages.guestProfile;
  const pf = messages.profileForm;

  // Fetch profile data
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, email")
    .eq("id", user.id)
    .single();

  const fullName = profile?.full_name || "";
  const email = profile?.email || user.email || "";
  const role = (profile?.role as string) || "guest";

  // Passport verification status
  const passportStatus = await checkVerificationStatus();
  const passport = passportConfig(passportStatus, t);

  // Avatar initials
  const initials = fullName
    ? fullName
        .split(" ")
        .map((n: string) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : email.charAt(0).toUpperCase();

  const roleLabel = role === "host" ? t.roleHost : role === "admin" ? t.roleAdmin : t.roleGuest;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="min-h-screen bg-[#0e0e0e] pt-12 pb-32 px-6 md:px-12">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <header className="mb-12">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white/30 hover:text-white/60 transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              {t.backToHome}
            </Link>
            <span className="block text-sm font-black text-[#C9A84C] uppercase tracking-[0.2em] mb-2">
              {t.account}
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              {t.myProfile}
            </h1>
            <p className="text-white/30 font-medium mt-2">
              {t.manageInfo}
            </p>
          </header>

          {/* ─── Profile Card ─── */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 md:p-8 mb-8">
            <div className="flex items-center gap-5">
              {/* Avatar */}
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#a88a3a] flex items-center justify-center text-white text-xl md:text-2xl font-black shrink-0 shadow-xl shadow-[#C9A84C]/10">
                {initials}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl md:text-2xl font-bold text-white truncate">
                  {fullName || t.guestUser}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="w-3.5 h-3.5 text-white/30 shrink-0" />
                  <span className="text-sm text-white/40 truncate">{email}</span>
                </div>
              </div>

              {/* Role Badge */}
              <div className="hidden sm:flex flex-col items-end gap-1.5">
                <span className="text-[10px] uppercase font-black tracking-widest text-white/20">
                  {t.role}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#C9A84C]/10 border border-[#C9A84C]/20 rounded-full text-[11px] font-black uppercase tracking-wider text-[#C9A84C]">
                  <Shield className="w-3 h-3" />
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>

          {/* ─── Edit Profile Form ─── */}
          <div className="mb-8">
            <ProfileForm
              initialName={fullName}
              updateProfileAction={updateProfile}
            />
          </div>

          {/* ─── Passport Verification Card ─── */}
          <div className={`rounded-2xl border p-6 md:p-8 ${passport.bg}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="mt-0.5">{passport.icon}</div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-white/40" />
                      {t.passportVerification}
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${passport.textColor} bg-white/[0.05]`}
                    >
                      {passport.label}
                    </span>
                  </div>
                  <p className="text-sm text-white/40 leading-relaxed max-w-md">
                    {passport.description}
                  </p>
                </div>
              </div>

              {passportStatus === "none" && (
                <Link
                  href="/guest/bookings"
                  className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#C9A84C] text-black text-xs font-black uppercase tracking-wider hover:bg-[#d4b85c] transition-all duration-300"
                >
                  {passport.actionLabel}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Inline animation keyframes */}
        <style>{`
          @keyframes fadeSlideIn {
            from {
              opacity: 0;
              transform: translateY(-12px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    </NextIntlClientProvider>
  );
}
