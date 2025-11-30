// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://bd10d9b181809060ba3bd0491d689356@o4510448453615616.ingest.de.sentry.io/4510448455188560",

  // Disable Sentry in development
  enabled: process.env.NODE_ENV === "production",

  // Performance monitoring - 10% of server transactions
  tracesSampleRate: 0.1,

  // Smart sampling for server-side
  tracesSampler: (samplingContext) => {
    const { name, parentSampled } = samplingContext;
    
    // Respect parent sampling decision
    if (parentSampled !== undefined) {
      return parentSampled;
    }
    
    // Always sample health check endpoints at 0%
    if (name?.includes("/health") || name?.includes("/api/health")) {
      return 0;
    }
    
    // Sample API routes at higher rate for debugging
    if (name?.includes("/api/")) {
      return 0.2; // 20% for API routes
    }
    
    // Default: 10%
    return 0.1;
  },

  // Enable sending user PII (for user identification in errors)
  sendDefaultPii: true,

  // Capture only errors from console (not warnings to reduce noise)
  integrations: [
    Sentry.captureConsoleIntegration({
      levels: ["error"], // Only capture console.error, not warnings
    }),
  ],

  // Limit max breadcrumbs to reduce payload size
  maxBreadcrumbs: 50,

  // Filter out expected Next.js errors
  ignoreErrors: [
    "NEXT_NOT_FOUND",
    "NEXT_REDIRECT",
    "DYNAMIC_SERVER_USAGE",
  ],

  // Add context for Supabase/database errors
  beforeSend(event, hint) {
    const error = hint.originalException;
    
    // Tag Supabase errors for easier filtering
    if (error && typeof error === "object") {
      const errorObj = error as Record<string, unknown>;
      if (errorObj.code || errorObj.details || errorObj.hint) {
        event.tags = {
          ...event.tags,
          error_type: "supabase",
          supabase_code: String(errorObj.code || "unknown"),
        };
        event.extra = {
          ...event.extra,
          supabase_details: errorObj.details,
          supabase_hint: errorObj.hint,
          supabase_message: errorObj.message,
        };
      }
    }

    return event;
  },
});

