"use client";

import { InvoicesList } from "@/components/stakeholder-services";
import { ArrowLeft } from "@phosphor-icons/react";
import Link from "next/link";

export default function StakeholderInvoicesPage() {
  return (
    <div className="min-h-screen bg-background-primary">
      {/* Header */}
      <div className="border-b border-border-secondary bg-surface-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/stakeholders"
              className="p-2 hover:bg-background-secondary rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-foreground-secondary" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-foreground-primary">
                All Invoices
              </h1>
              <p className="text-sm text-foreground-secondary">
                Manage invoices for all outgoing stakeholder services
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <InvoicesList showServiceColumn={true} />
      </div>
    </div>
  );
}
