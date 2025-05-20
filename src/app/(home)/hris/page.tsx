"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import BasicInfoTab from "./tabs/BasicInfoTab";
import PersonalInfoTab from "./tabs/PersonalInfoTab";
import EducationExperienceTab from "./tabs/EducationExperienceTab";
import { User, ClipboardList, GraduationCap, BarChart2, FileCheck } from "lucide-react";
import TabView, { TabItem } from "@/components/ui/TabView";

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

  const TABS: TabItem[] = [
    { 
      key: "basic", 
      label: "Basic Information", 
      icon: <User className="h-5 w-5" />, 
      color: "text-blue-600",
      content: <BasicInfoTab />
    },
    { 
      key: "personal", 
      label: "Personal Information", 
      icon: <ClipboardList className="h-5 w-5" />, 
      color: "text-purple-600",
      content: <PersonalInfoTab />
    },
    { 
      key: "education", 
      label: "Education & Experience", 
      icon: <GraduationCap className="h-5 w-5" />, 
      color: "text-emerald-600",
      content: <EducationExperienceTab />
    },
    { 
      key: "key-performance-indicator", 
      label: "Key Performance Indicator", 
      icon: <BarChart2 className="h-5 w-5" />, 
      color: "text-amber-600",
      content: (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
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
        </div>
      )
    },
    { 
      key: "performance-evaluation", 
      label: "Performance Evaluation", 
      icon: <FileCheck className="h-5 w-5" />, 
      color: "text-indigo-600",
      content: (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
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
        </div>
      )
    },
  ];

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
      
      <TabView 
        tabs={TABS}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </motion.div>
  );
}
