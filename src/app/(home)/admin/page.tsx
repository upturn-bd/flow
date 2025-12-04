"use client";

import Link from "next/link";
import {
    Settings, // Basic settings
    Settings2, // Advanced settings
    CreditCard, // Payroll
    DollarSign, // Transaction
    UsersRound, // Teams
    ClipboardList, // Task Log
    BarChart, // Project Log
    LogIn, // Attendance Log
    CalendarX, // Leave Log
    Bell, // Notice Log
    Clipboard, // Requisition Log
    WarningCircle, // Complaint Log
    Building, // Stakeholder Log
    UserPlus, // Onboarding Log
    GitBranch, // Stakeholder Processes (workflow/branching)
    FileIcon,
    Download, // Data Export
} from "@/lib/icons";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SearchBar, EmptyState, PageHeader } from "@/components/ui";

// --- New Structure for Admin Management ---
const sections = [
    {
        title: "Company Configurations",
        description: "Manage core company settings and rules",
        items: [
            {
                name: "Basic Settings",
                path: "/admin/config/basic",
                icon: Settings,
                description: "General company information and essential settings",
                color: "bg-blue-100 text-blue-700"
            },
            {
                name: "Advanced Settings",
                path: "/admin/config/advanced",
                icon: Settings2,
                description: "Configure system-wide and granular settings",
                color: "bg-indigo-100 text-indigo-700"
            },
            {
                name: "Payroll",
                path: "/admin/config/payroll",
                icon: CreditCard,
                description: "Manage salary structures, deductions, and payment rules",
                color: "bg-green-100 text-green-700"
            },
            {
                name: "Teams",
                path: "/admin/config/teams",
                icon: UsersRound,
                description: "Manage teams and assign granular permissions",
                color: "bg-violet-100 text-violet-700"
            },
            {
                name: "Stakeholder Process",
                path: "/admin/config/stakeholder-process",
                icon: GitBranch,
                description: "Manage workflow processes for stakeholders and leads",
                color: "bg-teal-100 text-teal-700"
            },
            {
                name: "Data Export",
                path: "/admin/data-export",
                icon: Download,
                description: "Export HRIS and stakeholder data to CSV format",
                color: "bg-emerald-100 text-emerald-700"
            },
        ],
    },
    {
        title: "Company Logs",
        description: "View system records, audit trails, and historical data",
        items: [
            {
                name: "Task",
                path: "/admin/logs/tasks",
                icon: ClipboardList,
                description: "View historical records for task management",
                color: "bg-indigo-100 text-indigo-700"
            },
            {
                name: "Project",
                path: "/admin/logs/project",
                icon: BarChart,
                description: "View historical records for project tracking",
                color: "bg-blue-100 text-blue-700"
            },
            {
                name: "Attendance",
                path: "/admin/logs/attendance",
                icon: LogIn,
                description: "Review historical check-in and check-out data",
                color: "bg-green-100 text-green-700"
            },
            {
                name: "Leave",
                path: "/admin/logs/leave",
                icon: CalendarX,
                description: "Review all past and pending leave requests",
                color: "bg-blue-100 text-blue-700"
            },
            {
                name: "Notice",
                path: "/admin/logs/notice",
                icon: Bell,
                description: "Archive and history of all published company notices",
                color: "bg-amber-100 text-amber-700"
            },
            {
                name: "Requisition",
                path: "/admin/logs/requisition",
                icon: Clipboard,
                description: "History of all equipment/supply requisition requests",
                color: "bg-cyan-100 text-cyan-700"
            },
            {
                name: "Complaint",
                path: "/admin/logs/complaint",
                icon: WarningCircle,
                description: "Archive of all submitted workplace complaints",
                color: "bg-red-100 text-red-700"
            },
            {
                name: "Stakeholder",
                path: "/admin/stakeholders",
                icon: Building,
                description: "Records of all stakeholder interactions and issues",
                color: "bg-purple-100 text-purple-700"
            },
            {
                name: "Transaction",
                path: "/admin/transaction",
                icon: DollarSign,
                description: "Define and manage financial transaction types and flows",
                color: "bg-emerald-100 text-emerald-700 border-emerald-200"
            },
            {
                name: "Onboarding",
                path: "/admin/logs/onboarding",
                icon: UserPlus,
                description: "Archive of all employee onboarding processes",
                color: "bg-purple-100 text-purple-700 border-purple-200"
            },
        ],
    }
];

export default function AdminManagementPage() {
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
            className="p-4 sm:p-10 lg:p-14"
            initial="hidden"
            animate="visible"
            variants={pageVariants}
        >
            <motion.div variants={itemVariants}>
                <PageHeader
                    title="Admin Management"
                    description="Configure company settings and review historical logs and records"
                    icon={Settings}
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
                    placeholder="Search for configurations, logs or keywords..."
                />

                {/* Section filters */}
                <div className="flex flex-wrap gap-2 mt-4">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedSection(null)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
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
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
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
                        icon={FileIcon}
                        title="No items found"
                        description="Try searching with different keywords or browse all items"
                        action={{
                            label: "View all items",
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
                            className="mb-10"
                            variants={sectionVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            layout
                        >
                            <motion.div
                                className="flex items-center mb-4"
                                variants={itemVariants}
                            >
                                <h2 className="text-xl font-bold text-foreground-primary mr-2">
                                    {section.title}
                                </h2>
                                <div className="h-px grow bg-border-primary"></div>
                            </motion.div>
                            <motion.p
                                className="text-foreground-secondary mb-6"
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
                                            layout
                                        >
                                            <Link
                                                href={item.path}
                                                className="group items-center p-4 bg-surface-primary rounded-lg border border-border-primary shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 block h-28"
                                            >
                                                <motion.div
                                                    whileHover={{ scale: 1.1 }}
                                                    className={`shrink-0 w-12 h-12 rounded-md ${item.color.split(' ').filter(c => !c.startsWith('border-')).join(' ')} flex items-center justify-center mr-4 transition-transform`}
                                                >
                                                    <Icon size={28} className="text-current" />
                                                </motion.div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="text-base font-semibold text-foreground-primary group-hover:text-primary-700 transition-colors truncate">
                                                            {item.name}
                                                        </h3>
                                                        <motion.svg
                                                            initial={{ x: 0 }}
                                                            whileHover={{ x: 3 }}
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            className="h-4 w-4 text-primary-600 ml-2 transition-all shrink-0"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </motion.svg>
                                                    </div>
                                                    <p className="text-sm text-foreground-secondary mt-0.5 line-clamp-2">
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
