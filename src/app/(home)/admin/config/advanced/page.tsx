"use client";

import AdvancedTab from "@/components/admin/tabs/AdvancedTab";
import { ModulePermissionsBanner } from "@/components/permissions";
import { PERMISSION_MODULES } from "@/lib/constants";

export default function AdvancedSettingsPage() {
  return (
    <>
      <h1 className="text-3xl font-bold text-foreground-primary mb-8">
          Advanced Settings Configuration
      </h1>
      
      {/* Permission Banner */}
      <ModulePermissionsBanner module={PERMISSION_MODULES.ADMIN_CONFIG} title="Admin Configuration" compact />
      
      {/* Assuming AdvancedTab contains the specific configuration logic */}
      <AdvancedTab />
    </>
  );
}
