"use client";

import RolesTab from "@/components/admin-management/tabs/RoleManagementTab";

export default function RolesAndPermissionsPage() {
  return (
    <>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Roles & Permissions Configuration
      </h1>
      {/* Assuming RolesTab contains the specific configuration logic */}
      <RolesTab />
    </>
  );
}
