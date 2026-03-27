import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: 1.0, // Lower to 0.1–0.2 in high-traffic production

  // Session Replay (optional — captures user sessions for debugging)
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration(),
    Sentry.browserTracingIntegration(),
  ],

  // Only send errors in production
  enabled: process.env.NODE_ENV === "production",

  // Filter noisy errors
  ignoreErrors: [
    // Browser extensions
    "Non-Error exception captured",
    // Network errors users cause by navigating away
    "AbortError",
    "Failed to fetch",
    "Load failed",
  ],
});
