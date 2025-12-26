"use client";

import TransactionTab from "@/components/admin/tabs/AccountsTab";
import { AdminBreadcrumbs } from "@/components/admin/AdminBreadcrumbs";
import { CurrencyDollar } from "@phosphor-icons/react";

export default function TransactionPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <AdminBreadcrumbs 
        section="Company Logs"
        pageName="Transaction"
        icon={<CurrencyDollar className="w-4 h-4" />}
      />
      <h1 className="text-3xl font-bold text-foreground-primary mb-8">
          Transaction
      </h1>
      {/* Assuming TransactionTab contains the specific configuration logic */}
      <TransactionTab />
    </div>
  );
}
