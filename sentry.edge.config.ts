import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: 1.0, // Lower to 0.1–0.2 in high-traffic production

  // Only send errors in production
  enabled: process.env.NODE_ENV === "production",
});
