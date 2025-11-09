// /app/admin/company-configurations/basic/page.tsx
"use client";

// No need to import AdminDataProvider, motion, or breadcrumb components here
import BasicTab from "@/components/admin/tabs/BasicTab";

export default function BasicSettingsPage() {
  // The layout.tsx now provides the wrapper elements (motion.div, Breadcrumbs, AdminDataProvider)
  return (
    <>
      {/* The layout handles the main title now, but you can keep a page-specific title if needed */}
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Basic Settings Configuration
      </h1>
      
      {/* BasicTab can safely call useAdminData because it's wrapped by layout.tsx */}
      <BasicTab />
    </>
  );
}