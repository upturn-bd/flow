"use client";

import { AdminDataProvider } from "@/contexts/AdminDataContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CaretRight, ClipboardText } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { ADMIN_LOG_ITEMS } from "@/lib/constants/navigation";

// Page title mapping for better display names
const PAGE_TITLES: Record<string, string> = {
    tasks: "Task Logs",
    project: "Project Logs",
    attendance: "Attendance Logs",
    leave: "Leave Logs",
    notice: "Notice Logs",
    requisition: "Requisition Logs",
    complaint: "Complaint Logs",
    "stakeholder-issues": "Stakeholder Issue Logs",
    onboarding: "Onboarding Logs",
};

// Helper function to format path segment for display
const formatSegment = (segment: string): string => {
    if (!segment) return "";
    // Check if we have a custom title
    if (PAGE_TITLES[segment]) {
        return PAGE_TITLES[segment];
    }
    // Otherwise, format by replacing hyphens/underscores with spaces and capitalizing
    return segment
        .split(/[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ') + " Log";
};

const LogsBreadcrumbs = () => {
    const pathname = usePathname();
    const pathSegments = pathname.split('/').filter(segment => segment);
    
    // Find the logs section
    const logsIndex = pathSegments.indexOf('logs');
    const logSection = logsIndex !== -1 && pathSegments[logsIndex + 1] 
        ? pathSegments[logsIndex + 1] 
        : null;
    
    // Find the navigation item to get proper title
    const navItem = ADMIN_LOG_ITEMS.find(item => 
        item.path.includes(logSection || '')
    );
    
    const baseBreadcrumbs = [
        { href: "/admin", label: "Admin Management" },
        { href: "/admin", label: "Company Logs" },
    ];
    
    return (
        <nav className="flex mb-6 text-sm font-medium text-foreground-tertiary" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
                {/* Base Breadcrumbs */}
                {baseBreadcrumbs.map((item, index) => (
                    <li key={index} className="inline-flex items-center">
                        <div className="flex items-center">
                            {index > 0 && <CaretRight className="w-4 h-4 text-foreground-tertiary" />}
                            <Link 
                                href={item.href} 
                                className={`${index > 0 ? 'ml-1 md:ml-3' : ''} text-foreground-secondary hover:text-primary-600 transition-colors`}
                            >
                                {item.label}
                            </Link>
                        </div>
                    </li>
                ))}
                
                {/* Current Log Page */}
                {logSection && (
                    <li aria-current="page">
                        <div className="flex items-center">
                            <CaretRight className="w-4 h-4 text-foreground-tertiary" />
                            <span className="ml-1 text-primary-600 md:ml-3 flex items-center font-semibold">
                                <ClipboardText className="w-4 h-4 mr-1.5" />
                                {navItem?.name || formatSegment(logSection)}
                            </span>
                        </div>
                    </li>
                )}
            </ol>
        </nav>
    );
};



export default function CompanyLogsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        // Assuming AdminDataProvider is required for all admin sub-pages
        <AdminDataProvider>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full p-4 sm:p-6 lg:p-8 pb-12"
            >
                <LogsBreadcrumbs />
                {children}
            </motion.div>
        </AdminDataProvider>
    );
}
