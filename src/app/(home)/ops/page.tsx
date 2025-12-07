"use client";

import { 
  ClipboardText, // Task
  ChartBar, // Project
  SignIn, // Attendance
  CalendarX, // Leave
  Bell, // Notice
  Clipboard, // Requisition
  CurrencyDollar, 
  WarningCircle, 
  UserPlus, // Onboarding
  File, 
  Users, 
  CreditCard, // Payroll
  Building, 
  UserMinus, // Stakeholder
  Briefcase // Operations icon 
} from "@phosphor-icons/react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  SearchBar, 
  EmptyState, 
  PageHeader, 
  NavigationCard, 
  NavigationCardGrid,
  NavigationSectionProps 
} from "@/components/ui";

const sections: NavigationSectionProps[] = [
  {
    title: "Workflow",
    description: "Manage tasks, projects and work processes",
    items: [
      {
        name: "Task",
        path: "/ops/tasks",
        icon: ClipboardText,
        description: "Assign, track and manage day-to-day tasks",
        iconColor: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
      },
      {
        name: "Project",
        path: "/ops/project",
        icon: ChartBar,
        description: "Plan and execute complex projects with milestones",
        iconColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
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
        icon: SignIn,
        description: "Track and manage your daily attendance",
        iconColor: "bg-success/10 text-success dark:bg-success/20"
      },
      {
        name: "Leave",
        path: "/ops/leave?tab=apply",
        icon: CalendarX,
        description: "Apply and manage time off and leaves",
        iconColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
      },
      {
        name: "Notice",
        path: "/ops/notice",
        icon: Bell,
        description: "Important company announcements and notices",
        iconColor: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
      },
      {
        name: "Requisition",
        path: "/ops/requisition?tab=create",
        icon: Clipboard,
        description: "Request equipment, supplies and services",
        iconColor: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400"
      },
      {
        name: "Settlement",
        path: "/ops/settlement?tab=create",
        icon: CurrencyDollar,
        description: "Manage and track expense reimbursements",
        iconColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      },
      {
        name: "Complaint",
        path: "/ops/complaint",
        icon: WarningCircle,
        description: "Submit and track workplace issues and concerns",
        iconColor: "bg-error/10 text-error dark:bg-error/20"
      },
      {
        name: "Payroll",
        path: "/ops/payroll",
        icon: CreditCard,
        description: "View payroll history and manage salary information",
        iconColor: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
      },
      {
        name: "Stakeholder Issues",
        path: "/ops/stakeholder-issues",
        icon: Building,
        description: "Manage stakeholder relationships and track issues",
        iconColor: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
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
        iconColor: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
      },
      {
        name: "Offboarding",
        path: "/ops/offboarding",
        icon: UserMinus,
        description: "Employee offboarding workflow and tasks",
        iconColor: "bg-error/10 text-error dark:bg-error/20"
      },
      {
        name: "HRIS",
        path: "/ops/hris",
        icon: Users,
        description: "Human Resource Information System",
        iconColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
      }
    ],
  },
];

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // FunnelSimple items based on search query
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
                ? 'bg-primary-100 text-primary-700 shadow-sm dark:bg-primary-900/30 dark:text-primary-400' 
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
                  ? 'bg-primary-100 text-primary-700 shadow-sm dark:bg-primary-900/30 dark:text-primary-400' 
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
                <div className="h-px grow bg-border-primary"></div>
              </motion.div>
              <motion.p 
                className="text-sm sm:text-base text-foreground-secondary mb-4"
                variants={itemVariants}
              >
                {section.description}
              </motion.p>
              
              <NavigationCardGrid columns={4}>
                {section.items.map((item) => (
                  <motion.div
                    key={item.name}
                    variants={itemVariants}
                    layout
                  >
                    <NavigationCard {...item} />
                  </motion.div>
                ))}
              </NavigationCardGrid>
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </motion.div>
  );
}
