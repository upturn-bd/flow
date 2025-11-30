"use client";

import TransactionTab from "@/components/admin/tabs/AccountsTab";

export default function TransactionPage() {
  return (
    <div className="p-3 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-foreground-primary mb-8">
          Transaction
      </h1>
      {/* Assuming TransactionTab contains the specific configuration logic */}
      <TransactionTab />
    </div>
  );
}
