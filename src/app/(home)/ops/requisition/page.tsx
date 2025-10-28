"use client";
import RequisitionHistoryPage from "@/components/ops/requisition/RequisitionHistoryPage";
import RequisitionRequestsPage from "@/components/ops/requisition/RequisitionRequestsPage";
import UpcomingPage from "@/components/ops/requisition/UpcomingPage";
import ServicePageTemplate from "@/components/ui/ServicePageTemplate";
import { TabItem } from "@/components/ui/TabView";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  FilePlus,
  ClipboardCheck,
  History,
  BookOpen,
  AlertTriangle,
  ScrollText
} from "lucide-react";


export default function RequisitionPage() {
  const [activeTab, setActiveTab] = useState("upcoming");

  const tabs: TabItem[] = [
    {
      key: "upcoming",
      label: "Create New",
      icon: <FilePlus className="h-5 w-5" />,
      color: "text-cyan-600",
      content: <UpcomingPage setActiveTab={setActiveTab} />
    },
    {
      key: "history",
      label: "History",
      icon: <History className="h-5 w-5" />,
      color: "text-indigo-600",
      content: <RequisitionHistoryPage />
    },
    {
      key: "requests",
      label: "Requests",
      icon: <ClipboardCheck className="h-5 w-5" />,
      color: "text-green-600",
      content: <RequisitionRequestsPage />
    },
    {
      key: "policy",
      label: "Policy",
      icon: <BookOpen className="h-5 w-5" />,
      color: "text-amber-600",
      content: (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <BookOpen className="h-16 w-16 text-cyan-200 mb-4" />
          </motion.div>
          <h3 className="text-xl font-medium mb-2">Requisition Policy</h3>
          <p className="mt-2 text-center max-w-md mb-6">
            Company requisition policies and guidelines will appear here. Please check back later or contact the procurement department for more information.
          </p>
          <div className="bg-cyan-50 border border-cyan-100 rounded-lg p-4 max-w-md">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-cyan-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-cyan-800 mb-1">Important Information</h4>
                <p className="text-sm text-cyan-700">
                  All requisitions require manager approval and should be submitted at least 7 days before the requested items are needed. Emergency requisitions follow a different approval process.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
  ];


  return (
    <ServicePageTemplate
      title="Requisition Management"
      description="Create, track, and manage requisition requests for your workplace needs efficiently."
      icon={<ScrollText className="h-7 w-7" />}
      primaryColor="text-cyan-600"
      tabs={tabs}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      actionButtonLabel="Create Requisition"
      actionButtonIcon={<FilePlus className="h-4 w-4" />}
      actionButtonOnClick={() => setActiveTab("upcoming")}
    />
  );
}
