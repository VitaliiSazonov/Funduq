import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";

// ── next-intl middleware instance ──
const intlMiddleware = createMiddleware(routing);

// ── Paths that should SKIP i18n routing (no locale prefix logic) ──
const I18N_BYPASS_PREFIXES = [
  "/admin",
  "/host",
  "/guest",
  "/login",
  "/register",
  "/reset-password",
  "/update-password",
  "/auth",
  "/api",
];

function shouldBypassIntl(pathname: string): boolean {
  return I18N_BYPASS_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Bypass i18n for admin/host/guest/auth routes ──
  // These routes stay at their current paths, English-only
  if (shouldBypassIntl(pathname)) {
    return await updateSession(request);
  }

  // ── 2. Run next-intl middleware for locale routing ──
  const intlResponse = intlMiddleware(request);

  // If next-intl returned a redirect (e.g. adding /ru prefix), follow it
  if (intlResponse.headers.get("x-middleware-rewrite") || intlResponse.status !== 200) {
    // Still need to update Supabase session on the response
    // Copy Supabase cookies to the intl response
    const supabaseResponse = await updateSession(request);
    // Transfer any Set-Cookie headers from Supabase to the intl response
    const setCookieHeaders = supabaseResponse.headers.getSetCookie();
    for (const cookie of setCookieHeaders) {
      intlResponse.headers.append("Set-Cookie", cookie);
    }
    return intlResponse;
  }

  // ── 3. For normal page loads, run Supabase session update ──
  // We need to merge: intl's locale detection + Supabase's cookie refresh
  const supabaseResponse = await updateSession(request);

  // Transfer Supabase cookies to the intl response
  const setCookieHeaders = supabaseResponse.headers.getSetCookie();
  for (const cookie of setCookieHeaders) {
    intlResponse.headers.append("Set-Cookie", cookie);
  }

  // If Supabase middleware issued a redirect (auth guard), follow that instead
  if (supabaseResponse.status >= 300 && supabaseResponse.status < 400) {
    return supabaseResponse;
  }

  return intlResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|llms\\.txt|areas(?:/[^/]*)?|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'
  ]
};
