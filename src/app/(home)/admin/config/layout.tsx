// /app/admin/config/layout.tsx
"use client";

import { AdminDataProvider } from "@/contexts/AdminDataContext";
import Link from "next/link";
import { usePathname } from "next/navigation"; // Hook to get the current URL
import { Home, ChevronRight, Settings } from "lucide-react";
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

const ConfigurationBreadcrumbs = () => {
    const pathname = usePathname();
    const pathSegments = pathname.split('/').filter(segment => segment); // Split and remove empty strings

    // The complete base path for configurations, including Home
    const baseBreadcrumbs = [
        // Added Home back for the start of the trail
        { href: "/admin", label: "Admin Management" },
        // This is the item that was being excluded by the old logic:
        { href: "/admin", label: "Company Configurations" }, 
    ];
    
    // The current page is the last segment of the path
    const currentSegment = pathSegments[pathSegments.length - 1];
    // Example: /basic -> Basic Settings
    const currentPageLabel = formatSegment(currentSegment) + " Settings";
    
    return (
        <nav className="flex mb-6 text-sm font-medium text-gray-500" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
                
                {/* 1. Render Base Breadcrumbs (Home, Admin Management, Company Configurations) */}
                {baseBreadcrumbs.map((item, index) => (
                    <li key={index} className="inline-flex items-center">
                        {/* Corrected Logic: 
                            - Always show the link.
                            - Only show the ChevronRight separator for items after the first one (i.e., index > 0). 
                        */}
                        <div className="flex items-center">
                            {/* Check if it's not the first item to render the separator */}
                            {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
                            
                            <Link 
                                href={item.href} 
                                // Adjust margin for items after Home
                                className={`ml-1 ${index > 0 ? 'md:ml-3' : 'md:ml-0'} text-gray-500 hover:text-blue-600 transition-colors inline-flex items-center`}
                            >
                                {item.label}
                            </Link>
                        </div>
                    </li>
                ))}
                
                {/* 2. Current Active Page */}
                <li aria-current="page">
                    <div className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                        <span className="ml-1 text-blue-600 md:ml-3 flex items-center">
                            <Settings className="w-4 h-4 mr-1.5" />
                            {currentPageLabel}
                        </span>
                    </div>
                </li>
            </ol>
        </nav>
    );
};


export default function CompanyConfigurationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 1. PROVIDE CONTEXT ONCE
    <AdminDataProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-3 bg-gray-50 sm:p-6 pb-12"
      >
        {/* 2. ADD BREADCRUMBS ONCE */}
        <ConfigurationBreadcrumbs />
        
        {/* 3. Render the specific page content (BasicTab, AdvancedTab, etc.) */}
        {children}
      </motion.div>
    </AdminDataProvider>
  );
}