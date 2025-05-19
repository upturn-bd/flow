"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import SettlementHistoryPage from "@/components/operations-and-services/settlement/SettlementHistory";
import SettlementRequestsPage from "@/components/operations-and-services/settlement/SettlementRequestsPage";
import UpcomingPage from "@/components/operations-and-services/settlement/UpcomingPage";

const tabs = [
  { 
    key: "upcoming", 
    label: "Create New",
    icon: <FilePlus className="h-5 w-5" />,
    color: "text-emerald-600"
  },
  { 
    key: "requests", 
    label: "Requests",
    icon: <ClipboardCheck className="h-5 w-5" />,
    color: "text-amber-600"
  },
  { 
    key: "history", 
    label: "History",
    icon: <History className="h-5 w-5" />,
    color: "text-blue-600"
  },
  { 
    key: "policy", 
    label: "Policy",
    icon: <BookOpen className="h-5 w-5" />,
    color: "text-purple-600"
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
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <DollarSign className="mr-2 h-7 w-7 text-emerald-600" />
          Claim Settlement
        </h1>
        
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

      {/* Desktop/Laptop Tab Layout */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="hidden sm:flex flex-wrap justify-start gap-2 bg-white rounded-xl shadow-sm mb-8 p-1.5 border border-gray-200 sticky top-0 z-10 overflow-x-auto"
      >
        {tabs.map((tab) => (
          <motion.button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`relative px-4 py-2.5 text-sm font-medium transition-all duration-200 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 flex items-center gap-2
              ${
                activeTab === tab.key
                  ? `bg-emerald-50 ${tab.color} shadow-sm`
                  : "text-gray-600 hover:text-emerald-600 hover:bg-gray-50"
              }
            `}
          >
            <span className={`${activeTab === tab.key ? tab.color : "text-gray-500"}`}>
              {tab.icon}
            </span>
            {tab.label}
            {activeTab === tab.key && (
              <motion.span 
                layoutId="active-tab-indicator"
                className="absolute left-2 right-2 -bottom-1 h-0.5 rounded-full bg-emerald-500" 
              />
            )}
          </motion.button>
        ))}
      </motion.div>

      {/* Mobile/Tablet Dropdown Layout */}
      <div className="sm:hidden mb-6">
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg text-gray-700 bg-white shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          {tabs.map((tab) => (
            <option key={tab.key} value={tab.key}>
              {tab.label}
            </option>
          ))}
        </select>
      </div>

      {/* Tab Content */}
      <div className="bg-transparent">
        <AnimatePresence mode="wait">
          {activeTab === "upcoming" && (
            <motion.div
              key="upcoming-tab"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={contentVariants}
            >
              <UpcomingPage />
            </motion.div>
          )}
          
          {activeTab === "requests" && (
            <motion.div
              key="requests-tab"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={contentVariants}
            >
              <SettlementRequestsPage />
            </motion.div>
          )}
          
          {activeTab === "history" && (
            <motion.div
              key="history-tab"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={contentVariants}
            >
              <SettlementHistoryPage />
            </motion.div>
          )}
          
          {activeTab === "policy" && (
            <motion.div
              key="policy-tab"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={contentVariants}
            >
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
