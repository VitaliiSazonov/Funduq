import type { NextConfig } from "next";

// ─── next-intl Integration ───
import createNextIntlPlugin from "next-intl/plugin";

// ─── Sentry Integration ───
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // ── SSR required (do NOT set output: 'export') ──
  compress: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "jftowqfrhhohkqkslfaa.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },

  // ── Security Headers ──
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              // Base
              "default-src 'self'",
              // Scripts: self + inline (Next.js needs inline for hydration)
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              // Styles: self + inline (Tailwind injects styles)
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Fonts: Google Fonts CDN
              "font-src 'self' https://fonts.gstatic.com data:",
              // Images: self + Supabase Storage + Unsplash + data URIs + blobs
              "img-src 'self' https://jftowqfrhhohkqkslfaa.supabase.co https://images.unsplash.com data: blob:",
              // Connect: self + Supabase APIs + Resend + Google OAuth + Sentry
              "connect-src 'self' https://jftowqfrhhohkqkslfaa.supabase.co https://*.supabase.co wss://*.supabase.co https://api.resend.com https://accounts.google.com https://oauth2.googleapis.com https://*.ingest.sentry.io",
              // Frames: Google OAuth popup
              "frame-src https://accounts.google.com https://jftowqfrhhohkqkslfaa.supabase.co",
              // Form actions
              "form-action 'self'",
              // Base URI restriction
              "base-uri 'self'",
              // Object embeds
              "object-src 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

// ─── Export (with next-intl + Sentry) ───
export default withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  webpack: {
    autoInstrumentMiddleware: true,
    autoInstrumentAppDirectory: true,
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
