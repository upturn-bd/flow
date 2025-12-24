// /app/admin/config/layout.tsx
"use client";

import { AdminDataProvider } from "@/contexts/AdminDataContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CaretRight, Gear } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { ADMIN_CONFIG_ITEMS } from "@/lib/constants/navigation";

// Page title mapping for better display names
const PAGE_TITLES: Record<string, string> = {
    basic: "Basic Settings",
    advanced: "Advanced Settings",
    payroll: "Payroll Configuration",
    teams: "Teams & Permissions",
    transaction: "Transaction Configuration",
    "stakeholder-process": "Stakeholder Process",
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
        .join(' ');
};

const ConfigurationBreadcrumbs = () => {
    const pathname = usePathname();
    const pathSegments = pathname.split('/').filter(segment => segment);
    
    // Find the config section (basic, advanced, etc.)
    const configIndex = pathSegments.indexOf('config');
    const configSection = configIndex !== -1 && pathSegments[configIndex + 1] 
        ? pathSegments[configIndex + 1] 
        : null;
    
    // Check if we're in a nested route (e.g., /admin/config/stakeholder-process/[id])
    const isNestedRoute = configIndex !== -1 && pathSegments.length > configIndex + 2;
    const nestedId = isNestedRoute ? pathSegments[pathSegments.length - 1] : null;
    
    // Find the navigation item to get proper title
    const navItem = ADMIN_CONFIG_ITEMS.find(item => 
        item.path.includes(configSection || '')
    );
    
    const baseBreadcrumbs = [
        { href: "/admin", label: "Admin Management" },
        { href: "/admin", label: "Company Configurations" },
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
                
                {/* Current Configuration Page */}
                {configSection && !isNestedRoute && (
                    <li aria-current="page">
                        <div className="flex items-center">
                            <CaretRight className="w-4 h-4 text-foreground-tertiary" />
                            <span className="ml-1 text-primary-600 md:ml-3 flex items-center font-semibold">
                                <Gear className="w-4 h-4 mr-1.5" />
                                {navItem?.name || formatSegment(configSection)}
                            </span>
                        </div>
                    </li>
                )}
                
                {/* Nested Route Breadcrumbs (e.g., specific stakeholder process) */}
                {configSection && isNestedRoute && (
                    <>
                        <li>
                            <div className="flex items-center">
                                <CaretRight className="w-4 h-4 text-foreground-tertiary" />
                                <Link 
                                    href={`/admin/config/${configSection}`}
                                    className="ml-1 md:ml-3 text-foreground-secondary hover:text-primary-600 transition-colors"
                                >
                                    {navItem?.name || formatSegment(configSection)}
                                </Link>
                            </div>
                        </li>
                        <li aria-current="page">
                            <div className="flex items-center">
                                <CaretRight className="w-4 h-4 text-foreground-tertiary" />
                                <span className="ml-1 text-primary-600 md:ml-3 flex items-center font-semibold">
                                    {nestedId === 'new' ? 'New' : `Details`}
                                </span>
                            </div>
                        </li>
                    </>
                )}
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
        className="p-4 sm:p-6 lg:p-8 pb-12"
      >
        {/* 2. ADD BREADCRUMBS ONCE */}
        <ConfigurationBreadcrumbs />
        
        {/* 3. Render the specific page content (BasicTab, AdvancedTab, etc.) */}
        {children}
      </motion.div>
    </AdminDataProvider>
  );
}