"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BasicInfoTab from "./tabs/BasicInfoTab";
import PersonalInfoTab from "./tabs/PersonalInfoTab";
import EducationExperienceTab from "./tabs/EducationExperienceTab";
import { User, ClipboardList, GraduationCap, BarChart2, FileCheck } from "lucide-react";

const TABS = [
  { key: "basic", label: "Basic Information", icon: <User className="h-5 w-5" />, color: "text-blue-600" },
  { key: "personal", label: "Personal Information", icon: <ClipboardList className="h-5 w-5" />, color: "text-purple-600" },
  { key: "education", label: "Education & Experience", icon: <GraduationCap className="h-5 w-5" />, color: "text-emerald-600" },
  { key: "key-performance-indicator", label: "Key Performance Indicator", icon: <BarChart2 className="h-5 w-5" />, color: "text-amber-600" },
  { key: "performance-evaluation", label: "Performance Evaluation", icon: <FileCheck className="h-5 w-5" />, color: "text-indigo-600" },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("basic");

  const pageVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: {
        duration: 0.5,
        when: "beforeChildren"
      }
    }
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={pageVariants}
      className="w-full mx-auto px-4 py-6 sm:px-6 lg:px-8 max-w-7xl"
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">My Profile</h1>
        <p className="text-sm sm:text-base text-gray-500 mt-1">View and update your profile information</p>
      </motion.div>
      
      {/* Desktop/Laptop Tab Layout */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="hidden sm:flex flex-wrap justify-start gap-2 bg-white rounded-xl shadow-sm mb-8 p-1.5 border border-gray-200 sticky top-0 z-10 overflow-x-auto"
      >
        {TABS.map((tab) => (
          <motion.button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`relative px-4 py-2.5 text-sm font-medium transition-all duration-200 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 flex items-center gap-2
              ${
                activeTab === tab.key
                  ? `bg-blue-50 ${tab.color} shadow-sm`
                  : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
              }
            `}
          >
            <span className={`${activeTab === tab.key ? tab.color : "text-gray-500"}`}>
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
        ))}
      </motion.div>

      {/* Mobile/Tablet Dropdown Layout */}
      <div className="sm:hidden mb-6">
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg text-gray-700 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {TABS.map((tab) => (
            <option key={tab.key} value={tab.key}>
              {tab.label}
            </option>
          ))}
        </select>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <AnimatePresence mode="wait">
          {activeTab === "basic" && (
            <motion.div
              key="basic-tab"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={contentVariants}
            >
              <BasicInfoTab />
            </motion.div>
          )}
          
          {activeTab === "personal" && (
            <motion.div
              key="personal-tab"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={contentVariants}
            >
              <PersonalInfoTab />
            </motion.div>
          )}
          
          {activeTab === "education" && (
            <motion.div
              key="education-tab"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={contentVariants}
            >
              <EducationExperienceTab />
            </motion.div>
          )}
          
          {activeTab === "key-performance-indicator" && (
            <motion.div
              key="kpi-tab"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={contentVariants}
              className="flex flex-col items-center justify-center py-16 text-gray-500"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <BarChart2 className="h-16 w-16 text-amber-200 mb-4" />
              </motion.div>
              <h3 className="text-xl font-medium mb-2">Key Performance Indicator</h3>
              <p className="mt-2 text-center max-w-md">
                This feature is coming soon. Performance indicators will help you track your progress and achievements.
              </p>
            </motion.div>
          )}
          
          {activeTab === "performance-evaluation" && (
            <motion.div
              key="evaluation-tab"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={contentVariants}
              className="flex flex-col items-center justify-center py-16 text-gray-500"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <FileCheck className="h-16 w-16 text-indigo-200 mb-4" />
              </motion.div>
              <h3 className="text-xl font-medium mb-2">Performance Evaluation</h3>
              <p className="mt-2 text-center max-w-md">
                This feature is coming soon. Performance evaluations will provide feedback on your work and achievements.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
