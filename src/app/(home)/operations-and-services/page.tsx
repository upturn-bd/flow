"use client";

import Link from "next/link";
import {
  ClipboardList, // Task
  BarChart, // Project
  Briefcase, // Process
  Users, // Stakeholder
  LogIn, // Attendance
  CalendarX, // Leave
  Bell, // Notice
  HandMetal, // Requests
  Clipboard, // Requisition
  DollarSign,
  AlertCircle,
  Star, // Rating
  Folder, // Digital Storage
  FileText, // Expenses
  Package, // Inventory
  UserPlus, // Onboarding
  LogOut, // Deboarding
  Wallet, // Payroll
  Gauge, // Performance
  BarChart2, // KPI
  File,
  Search,
  BellDot, // Reports
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const sections = [
  {
    title: "Workflow",
    description: "Manage tasks, projects and work processes",
    items: [
      {
        name: "Task",
        path: "/operations-and-services/workflow/task",
        icon: ClipboardList,
        description: "Assign, track and manage day-to-day tasks",
        color: "bg-indigo-100 text-indigo-700 border-indigo-200"
      },
      {
        name: "Project",
        path: "/operations-and-services/workflow/project",
        icon: BarChart,
        description: "Plan and execute complex projects with milestones",
        color: "bg-blue-100 text-blue-700 border-blue-200"
      },
    ],
  },
  {
    title: "Services",
    description: "Essential everyday services for employees",
    items: [
      {
        name: "Attendance",
        path: "/operations-and-services/services/attendance",
        icon: LogIn,
        description: "Track and manage your daily attendance",
        color: "bg-green-100 text-green-700 border-green-200"
      },
      {
        name: "Leave",
        path: "/operations-and-services/services/leave",
        icon: CalendarX,
        description: "Apply and manage time off and leaves",
        color: "bg-blue-100 text-blue-700 border-blue-200"
      },
      {
        name: "Notice",
        path: "/operations-and-services/services/notice",
        icon: Bell,
        description: "Important company announcements and notices",
        color: "bg-amber-100 text-amber-700 border-amber-200"
      },
      {
        name: "Requisition",
        path: "/operations-and-services/services/requisition",
        icon: Clipboard,
        description: "Request equipment, supplies and services",
        color: "bg-cyan-100 text-cyan-700 border-cyan-200"
      },
      {
        name: "Settlement",
        path: "/operations-and-services/services/settlement",
        icon: DollarSign,
        description: "Manage and track expense reimbursements",
        color: "bg-emerald-100 text-emerald-700 border-emerald-200"
      },
      {
        name: "Complaint",
        path: "/operations-and-services/services/complaint",
        icon: AlertCircle,
        description: "Submit and track workplace issues and concerns",
        color: "bg-red-100 text-red-700 border-red-200"
      },
    ],
  },
  {
    title: "Operations",
    description: "Processes for company operations and management",
    items: [
      {
        name: "Onboarding",
        path: "/operations-and-services/operations/onboarding",
        icon: UserPlus,
        description: "Employee onboarding workflow and tasks",
        color: "bg-purple-100 text-purple-700 border-purple-200"
      },
    ],
  },
];

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // Filter items based on search query
  const filteredSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
      ),
    }))
    .filter((section) => 
      section.items.length > 0 && 
      (selectedSection === null || section.title === selectedSection)
    );

  // Animation variants
  const pageVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  };

  return (
    <motion.div 
      className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8"
      initial="hidden"
      animate="visible"
      variants={pageVariants}
    >
      <motion.div 
        className="mb-8"
        variants={itemVariants}
      >
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Operations & Services
        </h1>
        <p className="text-gray-600">
          Access all operational tools and employee services
        </p>
      </motion.div>

      <motion.div 
        className="mb-6"
        variants={itemVariants}
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={20} className="text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Search for services, tools or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-300 transition-all outline-none"
            />
            {searchQuery && (
              <motion.button 
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            )}
          </div>
        </div>

        {/* Section filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedSection(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
              ${!selectedSection 
                ? 'bg-blue-100 text-blue-700 shadow-sm' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
            }
          >
            All
          </motion.button>
          
          {sections.map((section) => (
            <motion.button
              key={section.title}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedSection(section.title)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                ${selectedSection === section.title 
                  ? 'bg-blue-100 text-blue-700 shadow-sm' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
              }
            >
              {section.title}
            </motion.button>
          ))}
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {filteredSections.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-lg border border-gray-200 mt-8"
          >
            <File size={48} className="text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No services found</h3>
            <p className="text-gray-600 text-center max-w-md mb-5">
              Try searching with different keywords or browse all services
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSearchQuery("");
                setSelectedSection(null);
              }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
            >
              View all services
            </motion.button>
          </motion.div>
        ) : (
          filteredSections.map((section) => (
            <motion.div 
              key={section.title} 
              className="mb-10"
              variants={sectionVariants}
            >
              <motion.div 
                className="flex items-center mb-4"
                variants={itemVariants}
              >
                <h2 className="text-xl font-bold text-gray-800 mr-2">
                  {section.title}
                </h2>
                <div className="h-[1px] flex-grow bg-gray-200"></div>
              </motion.div>
              <motion.p 
                className="text-gray-600 mb-6"
                variants={itemVariants}
              >
                {section.description}
              </motion.p>
              
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                variants={sectionVariants}
              >
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.name}
                      variants={itemVariants}
                    >
                      <Link
                        href={item.path}
                        className={`group flex items-start p-4 bg-white rounded-lg border ${item.color.includes('border') ? item.color.split(' ').find(c => c.startsWith('border-')) : 'border-gray-200'} shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 block`}
                      >
                        <motion.div 
                          whileHover={{ scale: 1.1 }}
                          className={`flex-shrink-0 w-12 h-12 rounded-md ${item.color.split(' ').filter(c => !c.startsWith('border-')).join(' ')} flex items-center justify-center mr-4 transition-transform`}
                        >
                          <Icon size={28} className="text-current" />
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="text-base font-semibold text-gray-800 group-hover:text-blue-700 transition-colors truncate">
                              {item.name}
                            </h3>
                            <motion.svg 
                              initial={{ x: 0 }}
                              whileHover={{ x: 3 }}
                              xmlns="http://www.w3.org/2000/svg" 
                              className="h-4 w-4 text-blue-600 ml-2 transition-all flex-shrink-0" 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </motion.svg>
                          </div>
                          <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </motion.div>
  );
}
