"use client";

import AttendanceAbsentPage from "@/components/operations-and-services/attendance/AbsentPage";
import AttendanceLatePage from "@/components/operations-and-services/attendance/LatePage";
import AttendancePresentPage from "@/components/operations-and-services/attendance/PresentPage";
import AttendanceRequestsPage from "@/components/operations-and-services/attendance/RequestsPage";
import { useState } from "react";

const tabs = [
  { key: "present", label: "Present" },
  { key: "absent", label: "Absent" },
  { key: "late_wrong", label: "Late / Wrong Location" },
  { key: "request", label: "Request" },
];

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState("present");

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      {/* Desktop/Laptop Tab Layout */}
      <div className="hidden sm:flex flex-wrap justify-center gap-2 bg-white/80 rounded-xl shadow-sm mb-10 p-1 border border-gray-100 overflow-x-auto">
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

      {/* Mobile/Tablet Dropdown Layout */}
      <div className="sm:hidden mb-6">
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md text-sm"
        >
          {tabs.map((tab) => (
            <option key={tab.key} value={tab.key}>
              {tab.label}
            </option>
          ))}
        </select>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "present" && <AttendancePresentPage />}
        {activeTab === "absent" && <AttendanceAbsentPage />}
        {activeTab === "late_wrong" && <AttendanceLatePage />}
        {activeTab === "request" && <AttendanceRequestsPage />}
        {activeTab === "resolved" && (
          <div className="flex items-center justify-center h-screen">
            Resolved Tab Content
          </div>
        )}
      </div>
    </div>
  );
}
