"use client";

import CompletedProjectsList from "@/components/operations-and-services/project/CompletedProjectsList";
import CreateNewProjectPage from "@/components/operations-and-services/project/CreateNewProject";
import ProjectsList from "@/components/operations-and-services/project/OngoingProjectsView";
import { getEmployeeInfo } from "@/lib/api/employee";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FolderArchive,
  FolderPlus,
  FolderCheck,
  FolderOpen,
  Folder
} from "lucide-react";
import TabView, { TabItem } from "@/components/ui/TabView";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

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
  const [tabs, setTabs] = useState<TabItem[]>([]);

  useEffect(() => {
    async function fetchUserData() {
      try {
        const retrievedUser = await getEmployeeInfo();
        setUser(retrievedUser);
        if (retrievedUser.role === "Admin") {
          setTabs(TABS.map(tab => ({ ...tab, content: getTabContent(tab.key) })));
        } else {
          setTabs(TABS.filter(tab => tab.key !== "create-new").map(tab => ({ ...tab, content: getTabContent(tab.key) })));
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    }
    fetchUserData();
    // eslint-disable-next-line
  }, []);

  function getTabContent(key: string) {
    switch (key) {
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
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      className="max-w-6xl mx-auto p-4 sm:p-6"
    >
      <motion.div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center mb-2">
          <Folder className="mr-2 h-6 w-6 text-blue-500" />
          Project Management
        </h1>
        <p className="text-gray-600 max-w-3xl">
          Efficiently manage your projects from start to finish. Create, assign, and track progress to ensure successful completion of all project milestones.
        </p>
      </motion.div>
      {tabs.length > 0 && (
        <TabView
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      )}
    </motion.div>
  );
}
