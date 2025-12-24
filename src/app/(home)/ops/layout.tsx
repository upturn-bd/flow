// /app/ops/layout.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CaretRight, Briefcase } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { ALL_OPS_ITEMS } from "@/lib/constants/navigation";

// Page title mapping for better display names
const PAGE_TITLES: Record<string, string> = {
    tasks: "Task",
    task: "Task",
    project: "Project",
    attendance: "Attendance",
    leave: "Leave",
    notice: "Notice",
    requisition: "Requisition",
    settlement: "Settlement",
    complaint: "Complaint",
    payroll: "Payroll",
    stakeholders: "Stakeholders",
    "stakeholder-issues": "Tickets",
    onboarding: "Onboarding",
    offboarding: "Offboarding",
    hris: "HRIS",
    devices: "Device Management",
    edit: "Edit",
    new: "New",
};

// Helper function to format path segment for display
const formatSegment = (segment: string): string => {
    if (!segment) return "";
    // Check if we have a custom title
    if (PAGE_TITLES[segment]) {
        return PAGE_TITLES[segment];
    }
    // Check if it's a UUID or ID (typically for detail pages)
    if (segment.match(/^[a-f0-9-]{36}$/i) || segment.match(/^\d+$/)) {
        return "Details";
    }
    // Otherwise, format by replacing hyphens/underscores with spaces and capitalizing
    return segment
        .split(/[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const OperationsBreadcrumbs = () => {
    const pathname = usePathname();
    const pathSegments = pathname.split('/').filter(segment => segment);
    
    // Find the ops section (e.g., tasks, project, attendance, etc.)
    const opsIndex = pathSegments.indexOf('ops');
    const opsSection = opsIndex !== -1 && pathSegments[opsIndex + 1] 
        ? pathSegments[opsIndex + 1] 
        : null;
    
    // Check if we're in a nested route (e.g., /ops/tasks/[id], /ops/stakeholders/[id]/edit)
    const isNestedRoute = opsIndex !== -1 && pathSegments.length > opsIndex + 2;
    const nestedSegments = isNestedRoute ? pathSegments.slice(opsIndex + 2) : [];
    
    // Find the navigation item to get proper title and icon
    const navItem = ALL_OPS_ITEMS.find(item => {
        const itemPath = item.path.split('/').pop();
        return itemPath === opsSection;
    });
    
    const baseBreadcrumbs = [
        { href: "/ops", label: "Operations & Services" },
    ];
    
    return (
        <nav className="flex mb-6 text-sm font-medium text-foreground-tertiary" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
                {/* Base Breadcrumb - Operations Home */}
                {baseBreadcrumbs.map((item, index) => (
                    <li key={index} className="inline-flex items-center">
                        <Link 
                            href={item.href} 
                            className="text-foreground-secondary hover:text-primary-600 transition-colors"
                        >
                            {item.label}
                        </Link>
                    </li>
                ))}
                
                {/* Current Section (e.g., Tasks, Projects, Leave) */}
                {opsSection && !isNestedRoute && (
                    <li aria-current="page">
                        <div className="flex items-center">
                            <CaretRight className="w-4 h-4 text-foreground-tertiary" />
                            <span className="ml-1 text-primary-600 md:ml-3 flex items-center font-semibold">
                                {navItem?.icon && <navItem.icon className="w-4 h-4 mr-1.5" />}
                                {navItem?.name || formatSegment(opsSection)}
                            </span>
                        </div>
                    </li>
                )}
                
                {/* Nested Route Breadcrumbs (e.g., specific task, stakeholder detail, edit page) */}
                {opsSection && isNestedRoute && (
                    <>
                        {/* Parent section as link */}
                        <li>
                            <div className="flex items-center">
                                <CaretRight className="w-4 h-4 text-foreground-tertiary" />
                                <Link 
                                    href={`/ops/${opsSection}`}
                                    className="ml-1 md:ml-3 text-foreground-secondary hover:text-primary-600 transition-colors flex items-center"
                                >
                                    {navItem?.icon && <navItem.icon className="w-4 h-4 mr-1.5" />}
                                    {navItem?.name || formatSegment(opsSection)}
                                </Link>
                            </div>
                        </li>
                        
                        {/* Nested segments (e.g., [id], [id]/edit) */}
                        {nestedSegments.map((segment, idx) => {
                            const isLast = idx === nestedSegments.length - 1;
                            const segmentPath = `/ops/${opsSection}/${nestedSegments.slice(0, idx + 1).join('/')}`;
                            
                            return (
                                <li key={`nested-${idx}`} aria-current={isLast ? "page" : undefined}>
                                    <div className="flex items-center">
                                        <CaretRight className="w-4 h-4 text-foreground-tertiary" />
                                        {isLast ? (
                                            <span className="ml-1 text-primary-600 md:ml-3 flex items-center font-semibold">
                                                {formatSegment(segment)}
                                            </span>
                                        ) : (
                                            <Link 
                                                href={segmentPath}
                                                className="ml-1 md:ml-3 text-foreground-secondary hover:text-primary-600 transition-colors"
                                            >
                                                {formatSegment(segment)}
                                            </Link>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </>
                )}
            </ol>
        </nav>
    );
};


export default function OperationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Don't show breadcrumbs on the main /ops page
  const isOpsHome = pathname === "/ops";
  
  return (
    <>
      {/* Only show breadcrumbs if not on home page */}
      {!isOpsHome && (
        <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
          <OperationsBreadcrumbs />
        </div>
      )}
      
      {/* Render the specific page content */}
      {children}
    </>
  );
}
