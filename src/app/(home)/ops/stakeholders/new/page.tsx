"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { ModulePermissionsBanner } from "@/components/permissions";
import { PERMISSION_MODULES } from "@/lib/constants";
import { ArrowLeft } from "@phosphor-icons/react";
import StakeholderForm from "@/components/stakeholders/StakeholderForm";

export default function NewOpsStakeholderPage() {
  const router = useRouter();
  const { canWrite } = useAuth();

  // Check if user has permission to create stakeholders
  if (!canWrite(PERMISSION_MODULES.STAKEHOLDERS)) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-foreground-secondary hover:text-foreground-primary mb-4 sm:mb-6 text-sm sm:text-base"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="max-w-2xl mx-auto">
          <ModulePermissionsBanner 
            module={PERMISSION_MODULES.STAKEHOLDERS} 
            title="Create Stakeholder" 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-foreground-secondary hover:text-foreground-primary mb-4 sm:mb-6 text-sm sm:text-base"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <StakeholderForm
        onSuccess={() => router.push("/ops/stakeholders")}
        onCancel={() => router.back()}
        showProcessWarningLink={false}
      />
    </div>
  );
}
