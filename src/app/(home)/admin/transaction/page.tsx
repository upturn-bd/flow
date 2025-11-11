"use client";

import TransactionTab from "@/components/admin/tabs/AccountsTab";

export default function TransactionSettingsPage() {
  return (
    <>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Transaction
      </h1>
      {/* Assuming TransactionTab contains the specific configuration logic */}
      <TransactionTab />
    </>
  );
}
