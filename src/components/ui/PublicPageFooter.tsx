"use client";

import { LockKey } from "@phosphor-icons/react";

interface PublicPageFooterProps {
  className?: string;
}

/**
 * Footer for public-facing pages (stakeholder portal, etc.)
 */
export default function PublicPageFooter({ className = "" }: PublicPageFooterProps) {
  return (
    <div className={`border-t border-border-primary mt-12 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between text-sm text-foreground-secondary">
          <p>Powered by Flow</p>
          <div className="flex items-center gap-2">
            <LockKey size={16} />
            <span>Secure Access</span>
          </div>
        </div>
      </div>
    </div>
  );
}
