"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md text-center">
        <h1 className="mb-2 text-8xl font-bold text-gray-200">404</h1>
        <h2 className="mb-4 text-2xl font-semibold text-gray-900">
          Page not found
        </h2>
        <p className="mb-8 text-gray-600">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It
          might have been moved or deleted.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
          >
            Go home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}
