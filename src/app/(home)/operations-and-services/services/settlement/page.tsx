"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Receipt, 
  ClipboardCheck, 
  History, 
  BookOpen, 
  FileText, 
  DollarSign,
  AlertTriangle,
  FilePlus
} from "lucide-react";
import TabView, { TabItem } from "@/components/ui/TabView";
import SettlementHistoryPage from "@/components/operations-and-services/settlement/SettlementHistory";
import SettlementRequestsPage from "@/components/operations-and-services/settlement/SettlementRequestsPage";
import UpcomingPage from "@/components/operations-and-services/settlement/UpcomingPage";

const tabs: TabItem[] = [
  { 
    key: "upcoming", 
    label: "Create New",
    icon: <FilePlus className="h-5 w-5" />,
    color: "text-emerald-600",
    content: <UpcomingPage />
  },
  { 
    key: "requests", 
    label: "Requests",
    icon: <ClipboardCheck className="h-5 w-5" />,
    color: "text-amber-600",
    content: <SettlementRequestsPage />
  },
  { 
    key: "history", 
    label: "History",
    icon: <History className="h-5 w-5" />,
    color: "text-blue-600",
    content: <SettlementHistoryPage />
  },
  { 
    key: "policy", 
    label: "Policy",
    icon: <BookOpen className="h-5 w-5" />,
    color: "text-purple-600",
    content: (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
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
      </div>
    )
  },
];

export default function SettlementPage() {
  const [activeTab, setActiveTab] = useState("upcoming");

  const pageVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: {
        duration: 0.5,
        when: "beforeChildren"
      }
    },
    exit: { 
      opacity: 0, 
      transition: {
        duration: 0.3
      }
    }
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={pageVariants}
      className="max-w-6xl mx-auto p-4 sm:p-6"
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center mb-2">
            <DollarSign className="mr-2 h-7 w-7 text-emerald-600" />
            Claim Settlement
          </h1>
          <p className="text-gray-600 max-w-3xl">
            Submit, track, and manage reimbursement claims for business expenses efficiently.
          </p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTab("upcoming")}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <FilePlus className="h-4 w-4" />
          New Claim
        </motion.button>
      </motion.div>

      <TabView 
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        contentVariants={contentVariants}
      />
    </motion.div>
  );
}
