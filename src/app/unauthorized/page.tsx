"use client";

import Link from "next/link";
import { ShieldAlert } from "@/lib/icons";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background-secondary to-background-tertiary">
      <div className="max-w-md w-full mx-4">
        <div className="bg-surface-primary rounded-2xl shadow-xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <ShieldAlert className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-foreground-primary mb-3">
            Access Denied
          </h1>
          
          <p className="text-foreground-secondary mb-6">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
          
          <div className="space-y-3">
            <Link
              href="/home"
              className="block w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
            >
              Go to Home
            </Link>
            
            <Link
              href="/profile"
              className="block w-full py-3 px-4 bg-background-secondary dark:bg-background-tertiary hover:bg-background-tertiary dark:hover:bg-surface-secondary text-foreground-secondary font-medium rounded-lg transition-colors"
            >
              Go to Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
