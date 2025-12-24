/**
 * AdminBreadcrumbs Component
 * 
 * Reusable breadcrumb navigation for admin pages that don't have their own layout.
 * Used for standalone pages like data-export, transaction, and stakeholders.
 */

"use client";

import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react";
import { ReactNode } from "react";

interface BreadcrumbItem {
    href: string;
    label: string;
}

interface AdminBreadcrumbsProps {
    /** The section this page belongs to (e.g., "Company Configurations", "Company Logs") */
    section: "Company Configurations" | "Company Logs";
    /** The current page name */
    pageName: string;
    /** Optional icon to display next to the current page name */
    icon?: ReactNode;
}

export function AdminBreadcrumbs({ section, pageName, icon }: AdminBreadcrumbsProps) {
    const baseBreadcrumbs: BreadcrumbItem[] = [
        { href: "/admin", label: "Admin Management" },
        { href: "/admin", label: section },
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
                
                {/* Current Page */}
                <li aria-current="page">
                    <div className="flex items-center">
                        <CaretRight className="w-4 h-4 text-foreground-tertiary" />
                        <span className="ml-1 text-primary-600 md:ml-3 flex items-center font-semibold">
                            {icon && <span className="mr-1.5">{icon}</span>}
                            {pageName}
                        </span>
                    </div>
                </li>
            </ol>
        </nav>
    );
}
