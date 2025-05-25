"use client";

import React from "react";
import TaskCreateModal from "@/components/operations-and-services/task/TaskModal";
import TaskPage from "@/components/operations-and-services/task/OngoingTasks";
import CompletedTasksList from "@/components/operations-and-services/task/CompletedTasks";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ClipboardList,
  CheckSquare,
  PlusSquare,
  ArchiveIcon
} from "lucide-react";
import TabView, { TabItem } from "@/components/ui/TabView";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const TABS = [
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
  }
];

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState("ongoing");
  const [isLoading, setIsLoading] = useState(false);
  const [tabs, setTabs] = useState<TabItem[]>([]);

  function getTabContent(key: string) {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center min-h-[300px]">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600 font-medium ml-4">Loading content...</p>
        </div>
      );
    }
    switch (key) {
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
  }

  // Set up tabs with content on mount
  React.useEffect(() => {
    setTabs(TABS.map(tab => ({ ...tab, content: getTabContent(tab.key) })));
    // eslint-disable-next-line
  }, [isLoading]);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      className="max-w-6xl mx-auto p-4 sm:p-6"
    >
      <motion.div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center mb-2">
          <ClipboardList className="mr-2 h-6 w-6 text-indigo-500" />
          Task Management
        </h1>
        <p className="text-gray-600 max-w-3xl">
          Manage and track your tasks efficiently. Create, assign, and monitor progress to ensure timely completion of all your activities.
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
