"use client";

import TaskCreateModal from "@/components/operations-and-services/task/TaskModal";
import TaskPage from "@/components/operations-and-services/task/OngoingTasks";
import CompletedTasksList from "@/components/operations-and-services/task/CompletedTasks";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ClipboardList, 
  PlusCircle, 
  CheckCircle, 
  Archive, 
  CheckSquare,
  PlusSquare,
  ArchiveIcon,
  Loader2
} from "lucide-react";

const tabs = [
  { 
    key: "ongoing", 
    label: "Ongoing",
    icon: <ClipboardList className="h-5 w-5" />,
    color: "text-indigo-600"
  },
  { 
    key: "completed", 
    label: "Completed",
    icon: <CheckSquare className="h-5 w-5" />,
    color: "text-green-600"
  },
  { 
    key: "create-new", 
    label: "Create New",
    icon: <PlusSquare className="h-5 w-5" />,
    color: "text-blue-600"
  },
  { 
    key: "archived", 
    label: "Archived",
    icon: <ArchiveIcon className="h-5 w-5" />,
    color: "text-gray-600"
  },
];

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState("ongoing");
  const [isLoading, setIsLoading] = useState(false);

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
    if (isLoading) {
      return (
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="flex flex-col items-center">
            <motion.div 
              animate={{ 
                rotate: 360,
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                ease: "linear" 
              }}
              className="relative h-12 w-12"
            >
              <Loader2 className="h-12 w-12 text-indigo-500 animate-spin" />
            </motion.div>
            <p className="mt-4 text-gray-600 font-medium">Loading content...</p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case "ongoing":
        return <TaskPage />;
      case "completed":
        return <CompletedTasksList />;
      case "create-new":
        return <TaskCreateModal />;
      case "archived":
        return (
          <div className="flex flex-col items-center justify-center p-12 bg-gray-50/50 rounded-xl border border-gray-200 text-center">
            <ArchiveIcon className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Archived Tasks</h3>
            <p className="text-gray-500 max-w-md mb-6">
              This section will store your archived tasks that are no longer active but you want to keep for reference.
            </p>
            <p className="text-gray-400 text-sm">
              Feature coming soon...
            </p>
          </div>
        );
      default:
        return <TaskPage />;
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
          <ClipboardList className="mr-2 h-6 w-6 text-indigo-500" />
          Task Management
        </h1>
        <p className="text-gray-600 max-w-3xl">
          Manage and track your tasks efficiently. Create, assign, and monitor progress to ensure timely completion of all your activities.
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
            className={`relative px-4 py-2.5 text-sm font-medium transition-all duration-200 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 flex items-center gap-2
              ${
                activeTab === tab.key
                  ? `bg-indigo-50 ${tab.color} shadow-sm`
                  : "text-gray-600 hover:text-indigo-600 hover:bg-gray-50"
              }
            `}
          >
            <span className={`${activeTab === tab.key ? tab.color : "text-gray-500"}`}>
              {tab.icon}
            </span>
            {tab.label}
            {activeTab === tab.key && (
              <motion.span 
                layoutId="active-task-tab-indicator"
                className="absolute left-2 right-2 -bottom-1 h-0.5 rounded-full bg-indigo-500" 
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
          className="w-full p-3 border border-gray-300 rounded-lg text-gray-700 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
