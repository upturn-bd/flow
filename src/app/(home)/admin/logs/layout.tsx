"use client";

import { AdminDataProvider } from "@/contexts/AdminDataContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CaretRight, ClipboardList, FileText } from "@/lib/icons";
import { motion } from "framer-motion";

// Helper function to capitalize and format the path segment
const formatSegment = (segment: string) => {
    if (!segment) return "";
    // Replace hyphens/underscores with spaces and capitalize each word
    return segment
        .split(/[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const LogsBreadcrumbs = () => {
    const pathname = usePathname();
    const pathSegments = pathname.split('/').filter(segment => segment); // Split and remove empty strings

    // The complete base path for logs
    const baseBreadcrumbs = [
        // 1. Admin Management root
        { href: "/admin", label: "Admin Management" },
        // 2. Company Logs section (which is the parent layout)
        { href: "/admin", label: "Company Logs" }, 
    ];
    
    // The current page is the last segment of the path
    const currentSegment = pathSegments[pathSegments.length - 1];
    
    // Example: /task -> Task Log
    const currentPageLabel = formatSegment(currentSegment) + " Log";
    
    return (
        <nav className="flex mb-6 text-sm font-medium text-foreground-secondary" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
                
                {/* 1. Render Base Breadcrumbs (Admin Management, Company Logs) */}
                {baseBreadcrumbs.map((item, index) => (
                    <li key={index} className="inline-flex items-center">
                        <div className="flex items-center">
                            {/* Render separator for all items after the first one */}
                            {index > 0 && <CaretRight className="w-4 h-4 text-foreground-tertiary" />}
                            
                            <Link 
                                href={item.href} 
                                // Adjust margin for items after Admin Management
                                className={`ml-1 ${index > 0 ? 'md:ml-3' : 'md:ml-0'} text-foreground-secondary hover:text-primary-600 transition-colors inline-flex items-center`}
                            >
                                {item.label}
                            </Link>
                        </div>
                    </li>
                ))}
                
                {/* 2. Current Active Page */}
                <li aria-current="page">
                    <div className="flex items-center">
                        <CaretRight className="w-4 h-4 text-foreground-tertiary" />
                        {/* Using ClipboardList icon for log-related pages */}
                        <span className="ml-1 text-primary-600 md:ml-3 flex items-center font-semibold">
                            <ClipboardList className="w-4 h-4 mr-1.5" />
                            {currentPageLabel}
                        </span>
                    </div>
                </li>
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
