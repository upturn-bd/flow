// /app/admin/config/basic/page.tsx
"use client";

// No need to import AdminDataProvider, motion, or breadcrumb components here
import BasicTab from "@/components/admin/tabs/BasicTab";
import { ModulePermissionsBanner } from "@/components/permissions";
import { PERMISSION_MODULES } from "@/lib/constants";

export default function BasicSettingsPage() {
  // The layout.tsx now provides the wrapper elements (motion.div, Breadcrumbs, AdminDataProvider)
  return (
    <>
      {/* The layout handles the main title now, but you can keep a page-specific title if needed */}
      <h1 className="text-3xl font-bold text-foreground-primary mb-8">
          Basic Gear Configuration
      </h1>
      
      {/* Permission Banner */}
      <ModulePermissionsBanner module={PERMISSION_MODULES.ADMIN_CONFIG} title="Admin Configuration" compact />
      
      {/* BasicTab can safely call useAdminData because it's wrapped by layout.tsx */}
      <BasicTab />
    </>
  );
}