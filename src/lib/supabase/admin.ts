import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client using **service role key** — bypasses RLS.
 * ⚠️ NEVER import this on the client side or expose it in a bundle.
 * Use only in server actions / API routes for admin-level operations.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
