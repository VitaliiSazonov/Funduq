"use server";

import { createClient } from "@/lib/supabase/server";

// ─── Types ─────────────────────────────────────────────────────

export type PassportStatus = "none" | "pending" | "verified";

interface ActionResult {
  success: boolean;
  error?: string;
}

// ─── Constants ─────────────────────────────────────────────────

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
] as const;

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "application/pdf": "pdf",
};

// ─── Upload Passport ───────────────────────────────────────────

export async function uploadPassport(
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();

  // 1. Authenticate
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "You must be signed in." };
  }

  // 2. Extract file
  const file = formData.get("passport") as File | null;

  if (!file || file.size === 0) {
    return { success: false, error: "Please select a file to upload." };
  }

  // 3. Validate type
  if (!ALLOWED_TYPES.includes(file.type as typeof ALLOWED_TYPES[number])) {
    return {
      success: false,
      error: "Only JPG, PNG, or PDF files are accepted.",
    };
  }

  // 4. Validate size
  if (file.size > MAX_SIZE_BYTES) {
    return {
      success: false,
      error: "File size must be under 10 MB.",
    };
  }

  // 5. Build storage path: {userId}/{timestamp}.{ext}
  const ext = EXT_MAP[file.type] || "bin";
  const timestamp = Date.now();
  const storagePath = `${user.id}/${timestamp}.${ext}`;

  // 6. Upload to private bucket
  const { error: uploadError } = await supabase.storage
    .from("passport-documents")
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("[Passport] Upload error:", uploadError);
    return { success: false, error: "Upload failed. Please try again." };
  }

  // 7. Update profile — set URL + timestamp, NOT verified
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      passport_url: storagePath,
      passport_submitted_at: new Date().toISOString(),
      passport_verified: false,
    })
    .eq("id", user.id);

  if (updateError) {
    console.error("[Passport] Profile update error:", updateError);
    return { success: false, error: "Failed to save document info." };
  }

  // IMPORTANT: Never return passport_url to the frontend
  return { success: true };
}

// ─── Check Verification Status ─────────────────────────────────

export async function checkVerificationStatus(): Promise<PassportStatus> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return "none";
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("passport_url, passport_verified")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return "none";
  }

  if (profile.passport_verified === true) {
    return "verified";
  }

  if (profile.passport_url) {
    return "pending";
  }

  return "none";
}
