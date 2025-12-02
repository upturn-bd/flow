"use client";

import Link from "next/link";
import {
  ClipboardList, // Task
  BarChart, // Project
  LogIn, // Attendance
  CalendarX, // Leave
  Bell, // Notice
  Clipboard, // Requisition
  DollarSign,
  WarningCircle,
  UserPlus, // Onboarding
  File,
  Users,
  CreditCard, // Payroll
  Building,
  UserMinus, // Stakeholder
  Briefcase, // Operations icon
} from "@/lib/icons";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SearchBar, EmptyState, PageHeader } from "@/components/ui";

const sections = [
  {
    title: "Workflow",
    description: "Manage tasks, projects and work processes",
    items: [
      {
        name: "Task",
        path: "/ops/tasks",
        icon: ClipboardList,
        description: "Assign, track and manage day-to-day tasks",
        color: "bg-indigo-100 text-indigo-700"
      },
      {
        name: "Project",
        path: "/ops/project",
        icon: BarChart,
        description: "Plan and execute complex projects with milestones",
        color: "bg-blue-100 text-blue-700"
      },
    ],
  },
  {
    title: "Services",
    description: "Essential everyday services for employees",
    items: [
      {
        name: "Attendance",
        path: "/ops/attendance?tab=today",
        icon: LogIn,
        description: "Track and manage your daily attendance",
        color: "bg-green-100 text-green-700"
      },
      {
        name: "Leave",
        path: "/ops/leave?tab=apply",
        icon: CalendarX,
        description: "Apply and manage time off and leaves",
        color: "bg-blue-100 text-blue-700"
      },
      {
        name: "Notice",
        path: "/ops/notice",
        icon: Bell,
        description: "Important company announcements and notices",
        color: "bg-amber-100 text-amber-700"
      },
      {
        name: "Requisition",
        path: "/ops/requisition?tab=create",
        icon: Clipboard,
        description: "Request equipment, supplies and services",
        color: "bg-cyan-100 text-cyan-700"
      },
      {
        name: "Settlement",
        path: "/ops/settlement?tab=create",
        icon: DollarSign,
        description: "Manage and track expense reimbursements",
        color: "bg-emerald-100 text-emerald-700"
      },
      {
        name: "Complaint",
        path: "/ops/complaint",
        icon: WarningCircle,
        description: "Submit and track workplace issues and concerns",
        color: "bg-red-100 text-red-700"
      },
      {
        name: "Payroll",
        path: "/ops/payroll",
        icon: CreditCard,
        description: "View payroll history and manage salary information",
        color: "bg-indigo-100 text-indigo-700"
      },
      {
        name: "Stakeholder Issues",
        path: "/ops/stakeholder-issues",
        icon: Building,
        description: "Manage stakeholder relationships and track issues",
        color: "bg-purple-100 text-purple-700"
      },
    ],
  },
  {
    title: "Operations",
    description: "Processes for company operations and management",
    items: [
      {
        name: "Onboarding",
        path: "/ops/onboarding",
        icon: UserPlus,
        description: "Employee onboarding workflow and tasks",
        color: "bg-purple-100 text-purple-700"
      },
      {
        name: "Offboarding",
        path: "/ops/offboarding",
        icon: UserMinus,
        description: "Employee offboarding workflow and tasks",
        color: "bg-red-100 text-red-700"
      },
      {
        name: "HRIS",
        path: "/ops/hris",
        icon: Users,
        description: "Human Resource Information System",
        color: "bg-blue-100 text-blue-700"
      }
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
        type: "spring" as const,
        stiffness: 100,
        damping: 12
      }
    }
  };

  return (
    <motion.div 
      className="p-4 sm:p-6 lg:p-8"
      initial="hidden"
      animate="visible"
      variants={pageVariants}
    >
      <motion.div variants={itemVariants}>
        <PageHeader
          title="Operations & Services"
          description="Access all operational tools and employee services"
          icon={Briefcase}
          iconColor="text-primary-600"
        />
      </motion.div>

      <motion.div 
        className="mb-6"
        variants={itemVariants}
      >
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search services..."
        />

        {/* Section filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedSection(null)}
            className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors
              ${!selectedSection 
                ? 'bg-primary-600 text-white shadow-sm' 
                : 'bg-surface-secondary text-foreground-secondary hover:bg-surface-hover'}`
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
              className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors
                ${selectedSection === section.title 
                  ? 'bg-primary-600 text-white shadow-sm' 
                  : 'bg-surface-secondary text-foreground-secondary hover:bg-surface-hover'}`
              }
            >
              {section.title}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {filteredSections.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <EmptyState
            icon={File}
            title="No services found"
            description="Try searching with different keywords or browse all services"
            action={{
              label: "View all services",
              onClick: () => {
                setSearchQuery("");
                setSelectedSection(null);
              }
            }}
          />
        </motion.div>
      ) : (
        <AnimatePresence>
          {filteredSections.map((section) => (
            <motion.div 
              key={section.title} 
              className="mb-8"
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              layout
            >
              <motion.div 
                className="flex items-center mb-3"
                variants={itemVariants}
              >
                <h2 className="text-lg sm:text-xl font-bold text-foreground-primary mr-2">
                  {section.title}
                </h2>
                <div className="h-[1px] flex-grow bg-border-primary"></div>
              </motion.div>
              <motion.p 
                className="text-sm sm:text-base text-foreground-secondary mb-4"
                variants={itemVariants}
              >
                {section.description}
              </motion.p>
              
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
                variants={sectionVariants}
              >
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.name}
                      variants={itemVariants}
                      layout
                    >
                      <Link
                        href={item.path}
                        className="group flex flex-col sm:flex-row items-start sm:items-center p-3 sm:p-4 bg-surface-primary rounded-lg border border-border-primary shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 block min-h-[100px] sm:h-24"
                      >
                        <motion.div 
                          whileHover={{ scale: 1.1 }}
                          className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-md ${item.color.split(' ').filter(c => !c.startsWith('border-')).join(' ')} flex items-center justify-center mb-2 sm:mb-0 sm:mr-3 transition-transform`}
                        >
                          <Icon size={24} className="text-current sm:w-7 sm:h-7" />
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start sm:items-center justify-between">
                            <h3 className="text-sm sm:text-base font-semibold text-foreground-primary group-hover:text-primary-700 transition-colors line-clamp-1">
                              {item.name}
                            </h3>
                            <motion.svg 
                              initial={{ x: 0 }}
                              whileHover={{ x: 3 }}
                              xmlns="http://www.w3.org/2000/svg" 
                              className="hidden sm:block h-4 w-4 text-primary-600 ml-2 transition-all flex-shrink-0" 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </motion.svg>
                          </div>
                          <p className="text-xs sm:text-sm text-foreground-secondary mt-0.5 line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </motion.div>
  );
}
