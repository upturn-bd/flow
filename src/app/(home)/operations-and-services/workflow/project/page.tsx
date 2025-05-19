"use client";

import CompletedProjectsList from "@/components/operations-and-services/project/CompletedProjectsList";
import CreateNewProjectPage from "@/components/operations-and-services/project/CreateNewProject";
import ProjectsList from "@/components/operations-and-services/project/OngoingProjectsView";
import { getUserInfo } from "@/lib/auth/getUser";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, 
  FolderArchive, 
  FolderPlus, 
  FolderCheck, 
  FolderOpen,
  Folder
} from "lucide-react";

const TABS = [
  { 
    key: "ongoing", 
    label: "Ongoing", 
    icon: <FolderOpen size={16} />,
    color: "text-blue-600"
  },
  { 
    key: "completed", 
    label: "Completed", 
    icon: <FolderCheck size={16} />,
    color: "text-green-600"
  },
  { 
    key: "create-new", 
    label: "Create New", 
    icon: <FolderPlus size={16} />,
    color: "text-indigo-600"
  },
  { 
    key: "archived", 
    label: "Archived", 
    icon: <FolderArchive size={16} />,
    color: "text-gray-600"
  }
];

export default function ProjectPage() {
  const [activeTab, setActiveTab] = useState("ongoing");
  const [user, setUser] = useState<
    { id: string; name: string; role: string } | undefined
  >();
  const [loading, setLoading] = useState(true);
  const [tabs, setTabs] = useState<{ key: string; label: string; icon: React.ReactNode; color: string }[]>([]);

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

  useEffect(() => {
    async function fetchUserData() {
      try {
        const user = await getUserInfo();
        setUser(user);
        if (user.role === "Admin") {
          setTabs(TABS);
        } else {
          setTabs(TABS.filter((tab) => tab.key !== "create-new"));
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchUserData();
  }, []);
  
  // Helper function to render tab content
  const getTabContent = () => {
    if (loading) {
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
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
            </motion.div>
            <p className="mt-4 text-gray-600 font-medium">Loading projects...</p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case "create-new":
        return <CreateNewProjectPage />;
      case "ongoing":
        return <ProjectsList />;
      case "completed":
        return <CompletedProjectsList />;
      case "archived":
        return (
          <div className="flex flex-col items-center justify-center p-12 bg-gray-50/50 rounded-xl border border-gray-200 text-center">
            <FolderArchive className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Archived Projects</h3>
            <p className="text-gray-500 max-w-md mb-6">
              This section stores projects that are no longer active but kept for reference purposes.
            </p>
            <p className="text-gray-400 text-sm">
              Feature coming soon...
            </p>
          </div>
        );
      default:
        return <ProjectsList />;
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
          <Folder className="mr-2 h-6 w-6 text-blue-500" />
          Project Management
        </h1>
        <p className="text-gray-600 max-w-3xl">
          Efficiently manage your projects from start to finish. Create, assign, and track progress to ensure successful completion of all project milestones.
        </p>
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
            className={`relative px-4 py-2.5 text-sm font-medium transition-all duration-200 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 flex items-center gap-2
              ${
                activeTab === tab.key
                  ? `bg-blue-50 ${tab.color} shadow-sm`
                  : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
              }
            `}
          >
            <span className={`${activeTab === tab.key ? tab.color : "text-gray-500"}`}>
              {tab.icon}
            </span>
            {tab.label}
            {activeTab === tab.key && (
              <motion.span 
                layoutId="active-project-tab-indicator"
                className="absolute left-2 right-2 -bottom-1 h-0.5 rounded-full bg-blue-500" 
              />
            )}
          </motion.button>
        ))}
      </motion.div>

      {/* Mobile/Tablet Dropdown Layout */}
      <div className="sm:hidden mb-6">
        <div className="relative">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg text-gray-700 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
          >
            {tabs.map((tab) => (
              <option key={tab.key} value={tab.key}>
                {tab.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L6 6L11 1" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>
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
