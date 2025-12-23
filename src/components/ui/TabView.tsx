"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import Link from "next/link";

export type TabItem = {
  key: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  content: ReactNode;
  link?: string; // Add link for isLinked mode
};

export type TabViewProps = {
  tabs: TabItem[];
  activeTab: string;
  setActiveTab: (key: string) => void;
  contentVariants?: any;
  isLinked?: boolean;
  /** Prefix for data-tutorial attributes, e.g. "task" generates "task-ongoing-tab" */
  tutorialPrefix?: string;
};

export const TabView = ({
  tabs,
  activeTab,
  setActiveTab,
  contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.3,
      },
    },
  },
  isLinked = false,
  tutorialPrefix,
}: TabViewProps) => {
  return (
    <>
      {/* Desktop/Laptop Tab Layout */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="hidden sm:flex flex-wrap justify-start gap-2 bg-surface-primary rounded-xl shadow-sm mb-8 p-1.5 border border-border-primary sticky top-0 z-10 overflow-x-auto"
      >
        {tabs.map((tab) => {
          const tabButton = (
            <motion.button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              data-tutorial={tutorialPrefix ? `${tutorialPrefix}-${tab.key}-tab` : undefined}
              className={`relative px-4 py-2.5 text-sm font-medium transition-all duration-200 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 flex items-center gap-2
                ${activeTab === tab.key
                  ? `bg-primary-50 dark:bg-primary-900/30 ${tab.color} shadow-sm`
                  : "text-foreground-secondary hover:text-primary-600 dark:hover:text-primary-400 hover:bg-background-secondary dark:hover:bg-background-tertiary"
                }
              `}
              role="tab"
              aria-selected={activeTab === tab.key}
            >
              <span
                className={`${activeTab === tab.key ? tab.color : "text-foreground-tertiary"}`}
              >
                {tab.icon}
              </span>
              {tab.label}
              {activeTab === tab.key && (
                <motion.span
                  layoutId="active-tab-indicator"
                  className="absolute left-2 right-2 -bottom-1 h-0.5 rounded-full bg-primary-500"
                />
              )}
            </motion.button>
          );

          return isLinked && tab.link ? (
            <Link key={tab.key} href={tab.link}>
              {tabButton}
            </Link>
          ) : (
            tabButton
          );
        })}
      </motion.div>

      {/* Mobile/Tablet Dropdown Layout */}
      <div className="sm:hidden mb-6">
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
          className="w-full p-3 border border-border-primary rounded-lg text-foreground-primary bg-surface-primary shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          {tabs.map((tab) => (
            <option key={tab.key} value={tab.key}>
              {tab.label}
            </option>
          ))}
        </select>
      </div>

      {/* Tab Content */}
      {(tabs.find((tab) => tab.key === activeTab)?.content && (
        <div className="bg-surface-primary rounded-xl shadow-sm p-3 sm:p-6">
          {(() => {
            const activeTabData = tabs.find((tab) => tab.key === activeTab);
            return activeTabData ? activeTabData.content : null;
          })()}
        </div>
      ))}
    </>
  );
};

export default TabView;
