"use client";
import RequisitionHistoryPage from "@/components/operations-and-services/requisition/RequisitionHistoryPage";
import RequisitionRequestsPage from "@/components/operations-and-services/requisition/RequisitionRequestsPage";
import UpcomingPage from "@/components/operations-and-services/requisition/UpcomingPage";
import TabView, { TabItem } from "@/components/ui/TabView";
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

const tabs: TabItem[] = [
  { 
    key: "upcoming", 
    label: "Create New",
    icon: <FilePlus className="h-5 w-5" />,
    color: "text-cyan-600",
    content: <UpcomingPage />
  },
  { 
    key: "requests", 
    label: "Requests",
    icon: <ClipboardCheck className="h-5 w-5" />,
    color: "text-green-600",
    content: <RequisitionRequestsPage />
  },
  { 
    key: "history", 
    label: "History",
    icon: <History className="h-5 w-5" />,
    color: "text-indigo-600",
    content: <RequisitionHistoryPage />
  },
  { 
    key: "policy", 
    label: "Policy",
    icon: <BookOpen className="h-5 w-5" />,
    color: "text-amber-600",
    content: (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
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
      </div>
    )
  },
];

export default function RequisitionPage() {
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
            <ScrollText className="mr-2 h-7 w-7 text-cyan-600" />
            Requisition Management
          </h1>
          <p className="text-gray-600 max-w-3xl">
            Create, track, and manage requisition requests for your workplace needs efficiently.
          </p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTab("upcoming")}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <FilePlus className="h-4 w-4" />
          Create Requisition
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
