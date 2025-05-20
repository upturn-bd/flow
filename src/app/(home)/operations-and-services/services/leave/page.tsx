"use client";
import LeaveCreatePage from "@/components/operations-and-services/leave/LeaveCreatePage";
import LeaveHistoryPage from "@/components/operations-and-services/leave/LeaveHistory";
import LeaveRequestsPage from "@/components/operations-and-services/leave/LeaveRequests";
import TabView, { TabItem } from "@/components/ui/TabView";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CalendarX, 
  Clock, 
  FileCheck, 
  BookOpen, 
  PlusCircle, 
  AlertCircle,
  Calendar
} from "lucide-react";

const tabs: TabItem[] = [
  { 
    key: "home", 
    label: "Apply Leave",
    icon: <PlusCircle className="h-5 w-5" />,
    color: "text-blue-600",
    content: <LeaveCreatePage />
  },
  { 
    key: "requests", 
    label: "Requests",
    icon: <Clock className="h-5 w-5" />,
    color: "text-amber-600",
    content: <LeaveRequestsPage />
  },
  { 
    key: "history", 
    label: "History",
    icon: <FileCheck className="h-5 w-5" />,
    color: "text-green-600",
    content: <LeaveHistoryPage />
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
            <BookOpen className="h-16 w-16 text-blue-200 mb-4" />
          </motion.div>
          <h3 className="text-xl font-medium mb-2">Leave Policy</h3>
          <p className="mt-2 text-center max-w-md mb-6">
            Company leave policies and guidelines will appear here. Please check back later or contact HR for more information.
          </p>
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 max-w-md">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-blue-800 mb-1">Policy Information</h4>
                <p className="text-sm text-blue-700">
                  Leave policies typically include annual leave allowance, sick leave limits, maternity/paternity leave, and other special leave arrangements.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  },
];

export default function LeavePage() {
  const [activeTab, setActiveTab] = useState("home");

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
            <Calendar className="mr-2 h-7 w-7 text-blue-600" />
            Leave Management
          </h1>
          <p className="text-gray-600 max-w-3xl">
            Apply for leave, track requests, and view leave history. All your leave management in one place.
          </p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTab("home")}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <PlusCircle className="h-4 w-4" />
          Apply for Leave
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
