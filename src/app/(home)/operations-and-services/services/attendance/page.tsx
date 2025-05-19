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
    <div className="w-full mx-auto px-4 py-6 sm:px-6 lg:px-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Attendance</h1>
        <p className="text-sm sm:text-base text-gray-500 mt-1">View and manage your attendance records</p>
      </div>
      
      {/* Desktop/Laptop Tab Layout */}
      <div className="hidden sm:flex flex-wrap justify-start gap-2 bg-white rounded-xl shadow-sm mb-6 p-1.5 border border-gray-200 sticky top-0 z-10 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative px-4 py-2.5 text-sm font-medium transition-all duration-200 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
              ${
                activeTab === tab.key
                  ? "bg-blue-50 text-blue-700 shadow-sm"
                  : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
              }
            `}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute left-2 right-2 -bottom-1 h-0.5 rounded-full bg-blue-500" />
            )}
          </button>
        ))}
      </div>

      {/* Mobile/Tablet Dropdown Layout */}
      <div className="sm:hidden mb-6">
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg text-gray-700 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {tabs.map((tab) => (
            <option key={tab.key} value={tab.key}>
              {tab.label}
            </option>
          ))}
        </select>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm">
        {activeTab === "present" && <AttendancePresentPage />}
        {activeTab === "absent" && <AttendanceAbsentPage />}
        {activeTab === "late_wrong" && <AttendanceLatePage />}
        {activeTab === "request" && <AttendanceRequestsPage />}
        {activeTab === "resolved" && (
          <div className="flex items-center justify-center h-64">
            Resolved Tab Content
          </div>
        )}
      </div>
    </div>
  );
}
