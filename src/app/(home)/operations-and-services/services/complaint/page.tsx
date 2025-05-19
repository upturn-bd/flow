"use client";
import ComplaintCreatePage from "@/components/operations-and-services/complaint/ComplaintCreatePage";
import ComplaintHistoryPage from "@/components/operations-and-services/complaint/ComplaintHistory";
import ComplaintRequestsPage from "@/components/operations-and-services/complaint/ComplaintRequests";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertCircle,
  MessageSquare,
  History,
  BookOpen,
  FilePlus,
  ClipboardCheck,
  AlertTriangle,
  ReceiptText
} from "lucide-react";

const tabs = [
  { 
    key: "home", 
    label: "New Complaint",
    icon: <FilePlus className="h-5 w-5" />,
    color: "text-red-600"
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

export default function ComplaintPage() {
  const [activeTab, setActiveTab] = useState("home");

  const pageVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { duration: 0.4, when: "beforeChildren" } 
    },
    exit: { 
      opacity: 0, 
      transition: { duration: 0.2 } 
    }
  };

  const tabContentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 1,
        delay: 0.1
      } 
    },
    exit: { 
      opacity: 0, 
      y: -20, 
      transition: { duration: 0.2 } 
    }
  };

  // Helper function to render the active tab content
  const getTabContent = () => {
    switch (activeTab) {
      case "home":
        return <ComplaintCreatePage />;
      case "requests":
        return <ComplaintRequestsPage />;
      case "history":
        return <ComplaintHistoryPage />;
      case "policy":
        return (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-red-500" />
              Complaint Policy
            </h2>
            <div className="prose prose-red max-w-none">
              <p className="text-gray-600">
                Our complaint policy is designed to ensure that all employee concerns are addressed promptly and fairly. Please review the guidelines below before submitting a complaint.
              </p>
              <h3 className="text-lg font-semibold text-gray-700 mt-4">Submission Guidelines</h3>
              <ul className="mt-2 space-y-1 text-gray-600">
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  All complaints must be factual and include specific details about the incident.
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  Submit complaints within 7 days of the incident for prompt resolution.
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  Maintain confidentiality regarding the complaint and involved parties.
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  Follow up through the appropriate channels as directed.
                </li>
              </ul>
              <h3 className="text-lg font-semibold text-gray-700 mt-4">Resolution Process</h3>
              <ol className="mt-2 space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="bg-red-100 text-red-700 rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0">1</span>
                  <div>
                    <span className="font-medium">Initial Review (1-2 days):</span> Your complaint will be reviewed by HR and relevant department heads.
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="bg-red-100 text-red-700 rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0">2</span>
                  <div>
                    <span className="font-medium">Investigation (3-5 days):</span> Evidence will be gathered and interviews conducted as needed.
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="bg-red-100 text-red-700 rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0">3</span>
                  <div>
                    <span className="font-medium">Decision (2-3 days):</span> A resolution will be determined based on the investigation findings.
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="bg-red-100 text-red-700 rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0">4</span>
                  <div>
                    <span className="font-medium">Implementation:</span> The resolution will be implemented and all parties will be notified.
                  </div>
                </li>
              </ol>
            </div>
          </div>
        );
      default:
        return <ComplaintCreatePage />;
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={pageVariants}
      className="max-w-6xl mx-auto p-4 sm:p-6"
    >
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-gray-800 flex items-center mb-2">
          <AlertCircle className="mr-2 h-6 w-6 text-red-500" />
          Complaint Management
        </h1>
        <p className="text-gray-600 max-w-3xl">
          Submit, track, and manage workplace complaints and concerns. Our system ensures all issues are addressed promptly and fairly.
        </p>
      </motion.div>

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
            className={`relative px-4 py-2.5 text-sm font-medium transition-all duration-200 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 flex items-center gap-2
              ${
                activeTab === tab.key
                  ? `bg-red-50 ${tab.color} shadow-sm`
                  : "text-gray-600 hover:text-red-600 hover:bg-gray-50"
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
                className="absolute left-2 right-2 -bottom-1 h-0.5 rounded-full bg-red-500" 
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
          className="w-full p-3 border border-gray-300 rounded-lg text-gray-700 bg-white shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
        >
          {tabs.map((tab) => (
            <option key={tab.key} value={tab.key}>
              {tab.label}
            </option>
          ))}
        </select>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={tabContentVariants}
        >
          {getTabContent()}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
