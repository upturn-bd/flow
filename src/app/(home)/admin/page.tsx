"use client";

import { 
    Gear, // Basic/Advanced settings
    CreditCard, // Payroll
    CurrencyDollar, // Transaction
    Users, // Teams
    ClipboardText, // Task Log
    ChartBar, // Project Log
    SignIn, // Attendance Log
    CalendarX, // Leave Log
    Bell, // Notice Log
    Clipboard, // Requisition Log
    WarningCircle, // Complaint Log
    Building, // Stakeholder Log
    UserPlus, // Onboarding Log
    GitBranch, // Stakeholder Processes (workflow/branching)
    File, 
    Download // Data Export 
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

// --- New Structure for Admin Management ---
const sections: NavigationSectionProps[] = [
    {
        title: "Company Configurations",
        description: "Manage core company settings and rules",
        items: [
            {
                name: "Basic Gear",
                path: "/admin/config/basic",
                icon: Gear,
                description: "General company information and essential settings",
                iconColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
            },
            {
                name: "Advanced Gear",
                path: "/admin/config/advanced",
                icon: Gear,
                description: "Configure system-wide and granular settings",
                iconColor: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
            },
            {
                name: "Payroll",
                path: "/admin/config/payroll",
                icon: CreditCard,
                description: "Manage salary structures, deductions, and payment rules",
                iconColor: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            },
            {
                name: "Teams",
                path: "/admin/config/teams",
                icon: Users,
                description: "Manage teams and assign granular permissions",
                iconColor: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
            },
            {
                name: "Stakeholder Process",
                path: "/admin/config/stakeholder-process",
                icon: GitBranch,
                description: "Manage workflow processes for stakeholders and leads",
                iconColor: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400"
            },
            {
                name: "Data Export",
                path: "/admin/data-export",
                icon: Download,
                description: "Export HRIS and stakeholder data to CSV format",
                iconColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
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
                icon: ClipboardText,
                description: "View historical records for task management",
                iconColor: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
            },
            {
                name: "Project",
                path: "/admin/logs/project",
                icon: ChartBar,
                description: "View historical records for project tracking",
                iconColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
            },
            {
                name: "Attendance",
                path: "/admin/logs/attendance",
                icon: SignIn,
                description: "Review historical check-in and check-out data",
                iconColor: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            },
            {
                name: "Leave",
                path: "/admin/logs/leave",
                icon: CalendarX,
                description: "Review all past and pending leave requests",
                iconColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
            },
            {
                name: "Notice",
                path: "/admin/logs/notice",
                icon: Bell,
                description: "Archive and history of all published company notices",
                iconColor: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            },
            {
                name: "Requisition",
                path: "/admin/logs/requisition",
                icon: Clipboard,
                description: "History of all equipment/supply requisition requests",
                iconColor: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400"
            },
            {
                name: "Complaint",
                path: "/admin/logs/complaint",
                icon: WarningCircle,
                description: "Archive of all submitted workplace complaints",
                iconColor: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            },
            {
                name: "Stakeholder",
                path: "/admin/stakeholders",
                icon: Building,
                description: "Records of all stakeholder interactions and issues",
                iconColor: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
            },
            {
                name: "Transaction",
                path: "/admin/transaction",
                icon: CurrencyDollar,
                description: "Define and manage financial transaction types and flows",
                iconColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
            },
            {
                name: "Onboarding",
                path: "/admin/logs/onboarding",
                icon: UserPlus,
                description: "Archive of all employee onboarding processes",
                iconColor: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
            },
        ],
    }
];

export default function AdminManagementPage() {
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
                    title="Admin Management"
                    description="Configure company settings and review historical logs and records"
                    icon={Gear}
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
                        icon={File}
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

                            <NavigationCardGrid columns={3}>
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
