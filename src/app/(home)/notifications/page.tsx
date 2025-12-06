"use client";

import { useState } from "react";
import RequestsTab from "./tabs/RequestsTab";
import NotificationsTab from "./tabs/NotificationsTab";
import { PageHeader } from "@/components/ui/PageHeader";
import { Bell } from "@phosphor-icons/react";

const tabs = [
  { key: "requests", label: "Requests" },
  { key: "notifications", label: "Notifications" },
];

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState("requests");

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <div className="flex items-center justify-center mb-4">
        <PageHeader
          icon={Bell}
          iconColor="text-blue-600"
          title="Notifications"
          className="text-center"
        />
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
