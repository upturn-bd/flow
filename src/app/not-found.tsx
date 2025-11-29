"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background-secondary dark:bg-background-primary px-4">
      <div className="max-w-md text-center">
        <h1 className="mb-2 text-8xl font-bold text-foreground-tertiary">404</h1>
        <h2 className="mb-4 text-2xl font-semibold text-foreground-primary">
          Page not found
        </h2>
        <p className="mb-8 text-foreground-secondary">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It
          might have been moved or deleted.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-lg bg-primary-600 px-6 py-3 font-medium text-white transition-colors hover:bg-primary-700"
          >
            Go home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="rounded-lg border border-border-secondary bg-background-primary px-6 py-3 font-medium text-foreground-secondary transition-colors hover:bg-surface-hover"
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}
