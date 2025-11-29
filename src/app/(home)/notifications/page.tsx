"use client";

import { useState } from "react";
import RequestsTab from "./tabs/RequestsTab";
import NotificationsTab from "./tabs/NotificationsTab";

const tabs = [
  { key: "requests", label: "Requests" },
  { key: "notifications", label: "Notifications" },
];

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState("requests");

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <div className="flex items-center justify-center mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        <h1 className="text-2xl font-bold text-primary-700 dark:text-primary-400">Notifications</h1>
      </div>
      {/* Tab Bar */}
      <div className="flex items-center justify-center gap-2 bg-surface-primary/80 dark:bg-surface-primary/80 rounded-xl shadow-sm mb-10 p-1 border border-border-primary">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400
              ${activeTab === tab.key
                ? "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 shadow-sm"
                : "text-foreground-secondary hover:text-primary-600 dark:hover:text-primary-400 hover:bg-background-secondary dark:hover:bg-background-tertiary"}
            `}
            tabIndex={0}
            type="button"
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute left-2 right-2 -bottom-1 h-1 rounded-full bg-primary-500" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-surface-primary rounded-xl shadow p-6 min-h-[200px] border border-border-primary">
        {activeTab === "requests" && <RequestsTab />}
        {activeTab === "notifications" && <NotificationsTab />}
      </div>
    </div>
  );
}
