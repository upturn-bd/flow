"use client";

import { PaymentRecordsList } from "@/components/stakeholder-services";
import { ArrowLeft } from "@phosphor-icons/react";
import Link from "next/link";

export default function StakeholderPaymentsPage() {
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
                All Payments
              </h1>
              <p className="text-sm text-foreground-secondary">
                Manage payment records for all incoming stakeholder services
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <PaymentRecordsList showServiceColumn={true} />
      </div>
    </div>
  );
}
