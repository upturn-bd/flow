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
}: TabViewProps) => {
  return (
    <>
      {/* Desktop/Laptop Tab Layout */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="hidden sm:flex flex-wrap justify-start gap-2 bg-white rounded-xl shadow-sm mb-8 p-1.5 border border-gray-200 sticky top-0 z-10 overflow-x-auto"
      >
        {tabs.map((tab) => {
          const tabButton = (
            <motion.button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative px-4 py-2.5 text-sm font-medium transition-all duration-200 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 flex items-center gap-2
                ${activeTab === tab.key
                  ? `bg-blue-50 ${tab.color} shadow-sm`
                  : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                }
              `}
              role="tab"
              aria-selected={activeTab === tab.key}
            >
              <span
                className={`${activeTab === tab.key ? tab.color : "text-gray-500"}`}
              >
                {tab.icon}
              </span>
              {tab.label}
              {activeTab === tab.key && (
                <motion.span
                  layoutId="active-tab-indicator"
                  className="absolute left-2 right-2 -bottom-1 h-0.5 rounded-full bg-blue-500"
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
      {(tabs.find((tab) => tab.key === activeTab)?.content && (
        <div className="bg-white rounded-xl shadow-sm p-6">
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
