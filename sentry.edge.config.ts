// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://bd10d9b181809060ba3bd0491d689356@o4510448453615616.ingest.de.sentry.io/4510448455188560",

  // Disable Sentry in development
  enabled: process.env.NODE_ENV === "production",

  // Edge functions run frequently (middleware on every request)
  // Sample at low rate to avoid high costs
  tracesSampleRate: 0.05, // 5% of edge transactions

  // Smart sampling for edge
  tracesSampler: (samplingContext) => {
    // Respect parent sampling
    if (samplingContext.parentSampled !== undefined) {
      return samplingContext.parentSampled;
    }
    // Low sample rate for middleware (runs on every request)
    return 0.05;
  },

  // Enable sending user PII for user identification
  sendDefaultPii: true,

  // Limit breadcrumbs in edge (limited memory)
  maxBreadcrumbs: 20,
});
