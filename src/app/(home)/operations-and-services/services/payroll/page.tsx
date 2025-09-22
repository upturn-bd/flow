"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  CreditCard, 
  History, 
  ClipboardCheck, 
  Calculator,
  AlertTriangle,
  TrendingUp,
  Users,
  Plus
} from "lucide-react";
import ServicePageTemplate from "@/components/ui/ServicePageTemplate";
import { TabItem } from "@/components/ui/TabView";
import PayrollHistoryPage from "@/components/operations-and-services/payroll/PayrollHistory";
import PayrollRequestsPage from "@/components/operations-and-services/payroll/PayrollRequests";
import PayrollGenerationModal from "@/components/operations-and-services/payroll/PayrollGenerationModal";

const tabs: TabItem[] = [
  { 
    key: "history", 
    label: "History",
    icon: <History className="h-5 w-5" />,
    color: "text-blue-600",
    content: <PayrollHistoryPage />
  },
  { 
    key: "requests", 
    label: "Requests",
    icon: <ClipboardCheck className="h-5 w-5" />,
    color: "text-amber-600",
    content: <PayrollRequestsPage />
  },
  { 
    key: "overview", 
    label: "Overview",
    icon: <TrendingUp className="h-5 w-5" />,
    color: "text-emerald-600",
    content: (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Calculator className="h-16 w-16 text-indigo-200 mb-4" />
        </motion.div>
        <h3 className="text-xl font-medium mb-2">Payroll Overview</h3>
        <p className="mt-2 text-center max-w-md mb-6">
          Detailed payroll analytics, salary trends, and financial summaries will appear here. 
          This feature is coming soon.
        </p>
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 max-w-md">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-indigo-800 mb-1">Coming Soon</h4>
              <p className="text-sm text-indigo-700">
                Comprehensive payroll analytics including salary breakdowns, tax calculations, 
                and annual summaries will be available in future updates.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  },
];

export default function PayrollPage() {
  const [activeTab, setActiveTab] = useState("history");
  const [showGenerationModal, setShowGenerationModal] = useState(false);

  const handleGenerationSuccess = () => {
    // Refresh the history and requests tabs after successful generation
    setActiveTab("history");
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
      />
      
      <PayrollGenerationModal
        isOpen={showGenerationModal}
        onClose={() => setShowGenerationModal(false)}
        onSuccess={handleGenerationSuccess}
      />
    </>
  );
}