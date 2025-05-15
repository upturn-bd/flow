"use client";

import TaskCreateModal from "@/components/operations-and-services/task/TaskModal";
import TaskPage from "@/components/operations-and-services/task/OngoingTasks";
import { useEffect, useState } from "react";
import CompletedTasksList from "@/components/operations-and-services/task/CompletedTasks";

const tabs = [
  { key: "create-new", label: "Create New" },
  { key: "ongoing", label: "Ongoing" },
  { key: "completed", label: "Completed" },
  { key: "archived", label: "Archived" },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("ongoing");

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      <div className="flex items-center justify-center gap-2 bg-white/80 rounded-xl shadow-sm mb-10 p-1 border border-gray-100">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400
              ${
                activeTab === tab.key
                  ? "bg-blue-50 text-blue-700 shadow-sm"
                  : "text-gray-600 hover:text-blue-600 hover:bg-gray-100"
              }
            `}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute left-2 right-2 -bottom-1 h-1 rounded-full bg-blue-500" />
            )}
          </button>
        ))}
      </div>
      {activeTab === "create-new" && <TaskCreateModal />}
      {activeTab === "ongoing" && <TaskPage />}
      {activeTab === "completed" && <CompletedTasksList />}
      {activeTab === "archived" && (
        <div className="flex items-center justify-center h-screen">
          Archived Tab Content
        </div>
      )}
    </div>
  );
}
