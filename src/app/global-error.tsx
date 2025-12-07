"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-background-secondary dark:bg-background-primary px-4">
          <div className="max-w-md text-center">
            <div className="mb-6">
              <svg
                className="mx-auto h-16 w-16 text-error"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="mb-2 text-3xl font-bold text-foreground-primary">
              Something went wrong
            </h1>
            <p className="mb-6 text-foreground-secondary">
              We&apos;ve been notified and are working to fix the issue. Please
              try again or contact support if the problem persists.
            </p>
            {error.digest && (
              <p className="mb-6 font-mono text-xs text-foreground-tertiary">
                Error ID: {error.digest}
              </p>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={() => reset()}
                className="rounded-lg bg-primary-600 px-6 py-3 font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                Try again
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="rounded-lg border border-border-secondary bg-background-primary px-6 py-3 font-medium text-foreground-secondary transition-colors hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                Go home
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}