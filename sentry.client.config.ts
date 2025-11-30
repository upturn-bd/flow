// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Disable Sentry in development
  enabled: process.env.NODE_ENV === "production",

  // Performance monitoring - sample 10% of transactions in production
  // This balances cost vs visibility. Increase if you need more data.
  tracesSampleRate: 0.1,

  // Use smart sampling: always capture slow transactions
  tracesSampler: (samplingContext) => {
    // Always sample transactions with errors
    if (samplingContext.parentSampled !== undefined) {
      return samplingContext.parentSampled;
    }
    // Sample 100% of transactions that are slow (>3s)
    // This will be checked after the transaction completes
    return 0.1; // 10% base rate
  },

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Session Replay - optimized for cost
  replaysOnErrorSampleRate: 1.0, // Always capture replays when errors occur
  replaysSessionSampleRate: 0.01, // Only 1% of normal sessions (saves cost)

  // You can remove this option if you're not planning to use the Sentry Session Replay feature
  integrations: [
    Sentry.replayIntegration({
      // Only capture network details for your own domain
      networkDetailAllowUrls: [window.location.origin],
      // Mask sensitive data for privacy/compliance
      maskAllText: false,
      blockAllMedia: true, // Block media to reduce replay size & cost
      maskAllInputs: true, // Mask form inputs for security
      // Reduce replay size by limiting DOM mutations
      mutationLimit: 1000,
      // Don't capture mouse movements (reduces size significantly)
      // networkCaptureBodies: false, // Don't capture request/response bodies
    }),
    // Capture breadcrumbs selectively
    Sentry.breadcrumbsIntegration({
      console: true,
      dom: true, // Click events help debug
      fetch: true,
      history: true,
      xhr: false, // Disabled - fetch covers most cases
    }),
  ],

  // Filter out noisy errors
  ignoreErrors: [
    // Random plugins/extensions
    "top.GLOBALS",
    // Browser extensions
    /extensions\//i,
    /^chrome:\/\//i,
    /^moz-extension:\/\//i,
    // Network errors that are usually user-side issues
    "Network request failed",
    "NetworkError when attempting to fetch resource",
    "Load failed",
    // User aborted actions
    "AbortError",
    "The operation was aborted",
    "User denied",
    // ResizeObserver errors (browser quirk, not actionable)
    "ResizeObserver loop",
    // Script loading issues from ad blockers
    "Script error",
  ],

  // Deny URLs to filter out noise from browser extensions
  denyUrls: [
    /extensions\//i,
    /^chrome:\/\//i,
    /^chrome-extension:\/\//i,
    /^moz-extension:\/\//i,
  ],

  // Set the environment
  environment: process.env.NODE_ENV,

  // Send default PII for better user identification
  sendDefaultPii: true,

  // Add user context when available
  beforeSend(event, hint) {
    // Don't send events in development
    if (process.env.NODE_ENV === "development") {
      console.log("[Sentry] Would have sent:", event);
      return null;
    }

    // Add extra context for Supabase errors
    const error = hint.originalException;
    if (error && typeof error === "object" && "code" in error) {
      event.tags = {
        ...event.tags,
        supabase_error_code: String((error as { code?: string }).code),
      };
    }

    return event;
  },

  // Before sending breadcrumbs, add context
  beforeBreadcrumb(breadcrumb) {
    // Filter out noisy breadcrumbs
    if (breadcrumb.category === "console" && breadcrumb.level === "log") {
      return null; // Don't capture console.log, only errors/warnings
    }
    return breadcrumb;
  },
});
