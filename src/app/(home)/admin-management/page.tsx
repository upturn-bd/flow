"use client";

import Link from "next/link";
import {
    Settings, // Basic settings
    Settings2, // Advanced settings
    CreditCard, // Payroll
    DollarSign, // Transaction
    Users, // Roles
    UsersRound, // Teams
    ClipboardList, // Task Log
    BarChart, // Project Log
    LogIn, // Attendance Log
    CalendarX, // Leave Log
    Bell, // Notice Log
    Clipboard, // Requisition Log
    AlertCircle, // Complaint Log
    Building2, // Stakeholder Log
    UserPlus, // Onboarding Log
    File,
    Search,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// --- New Structure for Admin Management ---
const sections = [
    {
        title: "Company Configurations",
        description: "Manage core company settings and rules",
        items: [
            {
                name: "Basic Settings",
                path: "/admin-management/company-configurations/basic",
                icon: Settings,
                description: "General company information and essential settings",
                color: "bg-blue-100 text-blue-700 border-blue-200"
            },
            {
                name: "Advanced Settings",
                path: "/admin-management/company-configurations/advanced",
                icon: Settings2,
                description: "Configure system-wide and granular settings",
                color: "bg-indigo-100 text-indigo-700 border-indigo-200"
            },
            {
                name: "Payroll",
                path: "/admin-management/company-configurations/payroll",
                icon: CreditCard,
                description: "Manage salary structures, deductions, and payment rules",
                color: "bg-green-100 text-green-700 border-green-200"
            },
            {
                name: "Transaction",
                path: "/admin-management/company-configurations/transaction",
                icon: DollarSign,
                description: "Define and manage financial transaction types and flows",
                color: "bg-emerald-100 text-emerald-700 border-emerald-200"
            },
            {
                name: "Roles",
                path: "/admin-management/company-configurations/roles",
                icon: Users,
                description: "Define user roles, permissions, and access levels",
                color: "bg-purple-100 text-purple-700 border-purple-200"
            },
            {
                name: "Teams",
                path: "/admin-management/company-configurations/teams",
                icon: UsersRound,
                description: "Manage teams and assign granular permissions",
                color: "bg-violet-100 text-violet-700 border-violet-200"
            },
        ],
    },
    {
        title: "Company Logs",
        description: "View system records, audit trails, and historical data",
        items: [
            {
                name: "Task",
                path: "/admin-management/company-logs/tasks",
                icon: ClipboardList,
                description: "View historical records for task management",
                color: "bg-indigo-100 text-indigo-700 border-indigo-200"
            },
            {
                name: "Project",
                path: "/admin-management/company-logs/project",
                icon: BarChart,
                description: "View historical records for project tracking",
                color: "bg-blue-100 text-blue-700 border-blue-200"
            },
            {
                name: "Attendance",
                path: "/admin-management/company-logs/attendance",
                icon: LogIn,
                description: "Review historical check-in and check-out data",
                color: "bg-green-100 text-green-700 border-green-200"
            },
            {
                name: "Leave",
                path: "/admin-management/company-logs/leave",
                icon: CalendarX,
                description: "Review all past and pending leave requests",
                color: "bg-blue-100 text-blue-700 border-blue-200"
            },
            {
                name: "Notice",
                path: "/admin-management/company-logs/notice",
                icon: Bell,
                description: "Archive and history of all published company notices",
                color: "bg-amber-100 text-amber-700 border-amber-200"
            },
            {
                name: "Requisition",
                path: "/admin-management/company-logs/requisition",
                icon: Clipboard,
                description: "History of all equipment/supply requisition requests",
                color: "bg-cyan-100 text-cyan-700 border-cyan-200"
            },
            {
                name: "Complaint",
                path: "/admin-management/company-logs/complaint",
                icon: AlertCircle,
                description: "Archive of all submitted workplace complaints",
                color: "bg-red-100 text-red-700 border-red-200"
            },
            {
                name: "Stakeholder",
                path: "/admin-management/stakeholders",
                icon: Building2,
                description: "Records of all stakeholder interactions and issues",
                color: "bg-purple-100 text-purple-700 border-purple-200"
            },
            {
                name: "Onboarding",
                path: "/admin-management/company-logs/onboarding",
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
                    Admin Management
                </h1>
                <p className="text-gray-600">
                    Configure company settings and review historical logs and records
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
                            placeholder="Search for configurations, logs or keywords..."
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

            {filteredSections.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-lg border border-gray-200 mt-8"
                >
                    <File size={48} className="text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">No items found</h3>
                    <p className="text-gray-600 text-center max-w-md mb-5">
                        Try searching with different keywords or browse all items
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
                        View all items
                    </motion.button>
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
                                            layout
                                        >
                                            <Link
                                                href={item.path}
                                                // FIX: Changed 'items-start' to 'items-center' for vertical centering.
                                                className={`group flex items-center p-4 bg-white rounded-lg border ${item.color.includes('border') ? item.color.split(' ').find(c => c.startsWith('border-')) : 'border-gray-200'} shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 block h-full`}
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
                    ))}
                </AnimatePresence>
            )}
        </motion.div>
    );
}
