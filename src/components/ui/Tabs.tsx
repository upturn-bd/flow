"use client";

import { ReactNode } from "react";

export interface TabItem {
  key: string;
  label: string;
  icon?: ReactNode;
  count?: number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (key: string) => void;
  className?: string;
}

/**
 * Simple tab navigation component for switching between views.
 * Unlike TabView, this doesn't manage content - just the tab buttons.
 * Use this when you need custom content rendering logic per tab.
 */
export function Tabs({ tabs, activeTab, onTabChange, className = "" }: TabsProps) {
  return (
    <div className={`bg-surface-primary rounded-lg border border-border-primary overflow-hidden ${className}`}>
      <div className="border-b border-border-primary">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`px-4 sm:px-6 py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.key
                  ? "text-primary-600 border-b-2 border-primary-600 bg-primary-50 dark:bg-primary-950"
                  : "text-foreground-secondary hover:text-foreground-primary hover:bg-background-secondary"
              }`}
              role="tab"
              aria-selected={activeTab === tab.key}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && ` (${tab.count})`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Tabs;
