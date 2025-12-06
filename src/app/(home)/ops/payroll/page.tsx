"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, ClipboardText, Warning, Users } from "@phosphor-icons/react";
import ServicePageTemplate from "@/components/ui/ServicePageTemplate";
import { TabItem } from "@/components/ui/TabView";
import PendingPayrolls from "@/components/ops/payroll/PendingPayrolls";
import PublishedPayrolls from "@/components/ops/payroll/PublishedPayrolls";
import PaidPayrolls from "@/components/ops/payroll/PaidPayrolls";
import PayrollGenerationModal from "@/components/ops/payroll/PayrollGenerationModal";
import { PERMISSION_MODULES } from "@/lib/constants";

const tabs: TabItem[] = [
  { 
    key: "pending", 
    label: "Pending",
    icon: <ClipboardCheck className="h-5 w-5" />,
    color: "text-primary-600",
    content: <PendingPayrolls />
  },
  { 
    key: "published", 
    label: "Published",
    icon: <Warning className="h-5 w-5" />,
    color: "text-amber-600",
    content: <PublishedPayrolls />
  },
  { 
    key: "paid", 
    label: "Paid",
    icon: <CreditCard className="h-5 w-5" />,
    color: "text-green-600",
    content: <PaidPayrolls />
  },
];

export default function PayrollPage() {
  const [activeTab, setActiveTab] = useState("pending");
  const [showGenerationModal, setShowGenerationModal] = useState(false);

  const handleGenerationSuccess = () => {
    // Refresh the pending tab after successful generation
    setActiveTab("pending");
  };

  return (
    <>
      <ServicePageTemplate
        title="Payroll Management"
        description="View your payroll history, manage salary adjustments, and track compensation details."
        icon={<CreditCard className="h-7 w-7" />}
        primaryColor="text-indigo-600"
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        actionButtonLabel="Generate Payroll"
        actionButtonIcon={<Users className="h-4 w-4" />}
        actionButtonOnClick={() => setShowGenerationModal(true)}
        module={PERMISSION_MODULES.PAYROLL}
        showPermissionBanner={true}
      />
      
      <PayrollGenerationModal
        isOpen={showGenerationModal}
        onClose={() => setShowGenerationModal(false)}
        onSuccess={handleGenerationSuccess}
      />
    </>
  );
}