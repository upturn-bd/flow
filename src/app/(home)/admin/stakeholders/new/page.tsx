"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "@phosphor-icons/react";
import { AdminBreadcrumbs } from "@/components/admin/AdminBreadcrumbs";
import StakeholderForm from "@/components/stakeholders/StakeholderForm";

export default function NewStakeholderPage() {
  const router = useRouter();



  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Breadcrumbs */}
      <AdminBreadcrumbs 
        section="Company Logs"
        pageName="Add New Lead"
        icon={<Plus className="w-4 h-4" />}
      />
      
      {/* Header */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-foreground-secondary hover:text-foreground-primary mb-4 sm:mb-6 text-sm sm:text-base"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <StakeholderForm
        onSuccess={() => router.push("/admin/stakeholders")}
        onCancel={() => router.back()}
        showProcessWarningLink={true}
        processWarningLinkUrl="/admin/config/stakeholder-process"
      />
    </div>
  );
}
