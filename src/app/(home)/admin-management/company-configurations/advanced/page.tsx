"use client";

import AdvancedTab from "@/components/admin-management/tabs/AdvancedTab";

export default function AdvancedSettingsPage() {
  return (
    <>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Advanced Settings Configuration
      </h1>
      {/* Assuming AdvancedTab contains the specific configuration logic */}
      <AdvancedTab />
    </>
  );
}
