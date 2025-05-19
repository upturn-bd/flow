"use client";

import { useState } from "react";
import BasicInfoTab from "./tabs/BasicInfoTab";
import PersonalInfoTab from "./tabs/PersonalInfoTab";
import EducationExperienceTab from "./tabs/EducationExperienceTab";

const TABS = [
  { key: "basic", label: "Basic Information" },
  { key: "personal", label: "Personal Information" },
  { key: "education", label: "Education & Experience" },
  { key: "key-performance-indicator", label: "Key Performance Indicator" },
  { key: "performance-evaluation", label: "Performance Evaluation" },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("basic");

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      {/* Desktop/Laptop Tab Layout */}
      <div className="hidden lg:flex flex-wrap justify-center gap-2 bg-white/80 rounded-xl shadow-sm mb-10 p-1 border border-gray-100 overflow-x-auto">
        {TABS.map((tab) => (
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
      <div className="lg:hidden mb-6">
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md text-sm"
        >
          {TABS.map((tab) => (
            <option key={tab.key} value={tab.key}>
              {tab.label}
            </option>
          ))}
        </select>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "basic" && <BasicInfoTab />}
        {activeTab === "personal" && <PersonalInfoTab />}
        {activeTab === "education" && <EducationExperienceTab />}
        {activeTab === "key-performance-indicator" && (
          <div>Key Performance Indicator</div>
        )}
        {activeTab === "performance-evaluation" && (
          <div>Performance Evaluation</div>
        )}
      </div>
    </div>
  );
}
