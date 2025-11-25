"use client";

import { useState, Suspense } from "react";
import { motion } from "framer-motion";
import {
  Receipt,
  ClipboardCheck,
  History,
  BookOpen,
  DollarSign,
  AlertTriangle,
  FilePlus
} from "@/lib/icons";
import ServicePageTemplate from "@/components/ui/ServicePageTemplate";
import { TabItem } from "@/components/ui/TabView";
import SettlementHistoryPage from "@/components/ops/settlement/SettlementHistory";
import SettlementRequestsPage from "@/components/ops/settlement/SettlementRequestsPage";
import UpcomingPage from "@/components/ops/settlement/UpcomingPage";
import { PERMISSION_MODULES } from "@/lib/constants";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

function SettlementPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState(tab || "create");
  const tabs: TabItem[] = [
    {
      key: "create",
      label: "Create New",
      icon: <FilePlus className="h-5 w-5" />,
      color: "text-emerald-600",
      content: <UpcomingPage setActiveTab={setActiveTab} />,
      link: "/ops/settlement?tab=create",
    },
    {
      key: "history",
      label: "History",
      icon: <History className="h-5 w-5" />,
      color: "text-primary-600",
      content: <SettlementHistoryPage />,
      link: "/ops/settlement?tab=history",
    },
    {
      key: "requests",
      label: "Requests",
      icon: <ClipboardCheck className="h-5 w-5" />,
      color: "text-amber-600",
      content: <SettlementRequestsPage />,
      link: "/ops/settlement?tab=requests",
    },
    {
      key: "policy",
      label: "Policy",
      icon: <BookOpen className="h-5 w-5" />,
      color: "text-purple-600",
      content: (
        <div className="flex flex-col items-center justify-center py-12 text-foreground-secondary">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Receipt className="h-16 w-16 text-emerald-200 mb-4" />
          </motion.div>
          <h3 className="text-xl font-medium mb-2">Settlement Policy</h3>
          <p className="mt-2 text-center max-w-md mb-6">
            Company claim settlement policies and guidelines will appear here. Please check back later or contact the finance department for more information.
          </p>
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 max-w-md">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-emerald-800 mb-1">Important Information</h4>
                <p className="text-sm text-emerald-700">
                  All claims require proper documentation and receipts. Claims must be submitted within 30 days of the expense. Reimbursements are typically processed within 7-10 business days.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
      link: "/ops/settlement?tab=policy",
    },
  ];

  return (
    <ServicePageTemplate
      title="Claim Settlement"
      description="Submit, track, and manage reimbursement claims for business expenses efficiently."
      icon={<DollarSign className="h-7 w-7" />}
      primaryColor="text-emerald-600"
      tabs={tabs}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      actionButtonOnClick={() => {
        router.push("/ops/settlement?tab=create");
      }}
      isLinked={true}
      module={PERMISSION_MODULES.SETTLEMENT}
      showPermissionBanner={true}
    />
  );
}

export default function SettlementPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <DollarSign className="h-8 w-8 text-emerald-600 animate-pulse" />
          <p className="text-sm text-gray-600">Loading settlement...</p>
        </div>
      </div>
    }>
      <SettlementPageContent />
    </Suspense>
  );
}
