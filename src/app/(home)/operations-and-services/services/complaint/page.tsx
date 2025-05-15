"use client";
import ComplaintCreatePage from "@/components/operations-and-services/complaint/ComplaintCreatePage";
import ComplaintHistoryPage from "@/components/operations-and-services/complaint/ComplaintHistory";
import ComplaintRequestsPage from "@/components/operations-and-services/complaint/ComplaintRequests";
import { useState } from "react";
const tabs = [
  { key: "home", label: "Home" },
  { key: "requests", label: "Requests" },
  { key: "history", label: "History" },
  { key: "policy", label: "Policy" },
];

export default function ComplaintPage() {
  const [activeTab, setActiveTab] = useState("home");

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
      {activeTab === "home" && <ComplaintCreatePage />}
      {activeTab === "requests" && <ComplaintRequestsPage />}
      {activeTab === "history" && <ComplaintHistoryPage />}
      {activeTab === "policy" && (
        <div className="flex items-center justify-center h-screen">
          Policy Tab Content
        </div>
      )}
    </div>
  );
}
