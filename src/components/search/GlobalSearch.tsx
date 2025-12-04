"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  ClipboardList,
  BarChart,
  LogIn,
  CalendarX,
  Bell,
  Clipboard,
  DollarSign,
  WarningCircle,
  UserPlus,
  Users,
  CreditCard,
  Building,
  Settings,
  Settings2,
  UsersRound,
  GitBranch,
  Download,
  UserMinus,
  CaretRight,
} from "@/lib/icons";
import { cn } from "@/components/ui/class";
import { useAuth } from "@/lib/auth/auth-context";
import Portal from "@/components/ui/Portal";

interface SearchItem {
  name: string;
  path: string;
  icon: any;
  description: string;
  category: string;
  keywords?: string[];
}

// Operations modules
const opsItems: SearchItem[] = [
  {
    name: "Tasks",
    path: "/ops/tasks",
    icon: ClipboardList,
    description: "Assign, track and manage day-to-day tasks",
    category: "Operations",
    keywords: ["task", "todo", "work", "assign"],
  },
  {
    name: "Projects",
    path: "/ops/project",
    icon: BarChart,
    description: "Plan and execute complex projects with milestones",
    category: "Operations",
    keywords: ["project", "milestone", "plan"],
  },
  {
    name: "Attendance",
    path: "/ops/attendance?tab=today",
    icon: LogIn,
    description: "Track and manage your daily attendance",
    category: "Operations",
    keywords: ["attendance", "check-in", "check-out", "time"],
  },
  {
    name: "Leave",
    path: "/ops/leave?tab=apply",
    icon: CalendarX,
    description: "Apply and manage time off and leaves",
    category: "Operations",
    keywords: ["leave", "vacation", "time off", "holiday"],
  },
  {
    name: "Notices",
    path: "/ops/notice",
    icon: Bell,
    description: "Important company announcements and notices",
    category: "Operations",
    keywords: ["notice", "announcement", "news"],
  },
  {
    name: "Requisition",
    path: "/ops/requisition?tab=create",
    icon: Clipboard,
    description: "Request equipment, supplies and services",
    category: "Operations",
    keywords: ["requisition", "request", "equipment", "supplies"],
  },
  {
    name: "Settlement",
    path: "/ops/settlement?tab=create",
    icon: DollarSign,
    description: "Manage and track expense reimbursements",
    category: "Operations",
    keywords: ["settlement", "expense", "reimbursement", "money"],
  },
  {
    name: "Complaints",
    path: "/ops/complaint",
    icon: WarningCircle,
    description: "Submit and track workplace issues and concerns",
    category: "Operations",
    keywords: ["complaint", "issue", "concern", "problem"],
  },
  {
    name: "Payroll",
    path: "/ops/payroll",
    icon: CreditCard,
    description: "View payroll history and manage salary information",
    category: "Operations",
    keywords: ["payroll", "salary", "payment", "wage"],
  },
  {
    name: "Stakeholder Issues",
    path: "/ops/stakeholder-issues",
    icon: Building,
    description: "Manage stakeholder relationships and track issues",
    category: "Operations",
    keywords: ["stakeholder", "client", "vendor", "partner"],
  },
  {
    name: "Onboarding",
    path: "/ops/onboarding",
    icon: UserPlus,
    description: "Employee onboarding workflow and tasks",
    category: "Operations",
    keywords: ["onboarding", "new employee", "hire"],
  },
  {
    name: "Offboarding",
    path: "/ops/offboarding",
    icon: UserMinus,
    description: "Employee offboarding workflow and tasks",
    category: "Operations",
    keywords: ["offboarding", "exit", "leaving"],
  },
  {
    name: "HRIS",
    path: "/ops/hris",
    icon: Users,
    description: "Human Resource Information System",
    category: "Operations",
    keywords: ["hris", "hr", "employee", "human resource"],
  },
];

// Admin configuration items
const adminConfigItems: SearchItem[] = [
  {
    name: "Basic Settings",
    path: "/admin/config/basic",
    icon: Settings,
    description: "General company information and essential settings",
    category: "Admin Config",
    keywords: ["settings", "config", "company", "basic"],
  },
  {
    name: "Advanced Settings",
    path: "/admin/config/advanced",
    icon: Settings2,
    description: "Configure system-wide and granular settings",
    category: "Admin Config",
    keywords: ["settings", "advanced", "system"],
  },
  {
    name: "Payroll Config",
    path: "/admin/config/payroll",
    icon: CreditCard,
    description: "Manage salary structures, deductions, and payment rules",
    category: "Admin Config",
    keywords: ["payroll", "salary", "config"],
  },
  {
    name: "Teams",
    path: "/admin/config/teams",
    icon: UsersRound,
    description: "Manage teams and assign granular permissions",
    category: "Admin Config",
    keywords: ["teams", "permissions", "access"],
  },
  {
    name: "Stakeholder Process",
    path: "/admin/config/stakeholder-process",
    icon: GitBranch,
    description: "Manage workflow processes for stakeholders",
    category: "Admin Config",
    keywords: ["stakeholder", "workflow", "process"],
  },
  {
    name: "Data Export",
    path: "/admin/data-export",
    icon: Download,
    description: "Export HRIS and stakeholder data to CSV format",
    category: "Admin Config",
    keywords: ["export", "data", "csv", "download"],
  },
];

// Admin log items
const adminLogItems: SearchItem[] = [
  {
    name: "Task Log",
    path: "/admin/logs/tasks",
    icon: ClipboardList,
    description: "View historical records for task management",
    category: "Admin Logs",
    keywords: ["task", "log", "history"],
  },
  {
    name: "Project Log",
    path: "/admin/logs/project",
    icon: BarChart,
    description: "View historical records for project tracking",
    category: "Admin Logs",
    keywords: ["project", "log", "history"],
  },
  {
    name: "Attendance Log",
    path: "/admin/logs/attendance",
    icon: LogIn,
    description: "Review historical check-in and check-out data",
    category: "Admin Logs",
    keywords: ["attendance", "log", "history"],
  },
  {
    name: "Leave Log",
    path: "/admin/logs/leave",
    icon: CalendarX,
    description: "Review all past and pending leave requests",
    category: "Admin Logs",
    keywords: ["leave", "log", "history"],
  },
  {
    name: "Notice Log",
    path: "/admin/logs/notice",
    icon: Bell,
    description: "Archive and history of all published notices",
    category: "Admin Logs",
    keywords: ["notice", "log", "history"],
  },
  {
    name: "Requisition Log",
    path: "/admin/logs/requisition",
    icon: Clipboard,
    description: "History of all requisition requests",
    category: "Admin Logs",
    keywords: ["requisition", "log", "history"],
  },
  {
    name: "Complaint Log",
    path: "/admin/logs/complaint",
    icon: WarningCircle,
    description: "Archive of all submitted complaints",
    category: "Admin Logs",
    keywords: ["complaint", "log", "history"],
  },
  {
    name: "Stakeholders",
    path: "/admin/stakeholders",
    icon: Building,
    description: "Records of all stakeholder interactions",
    category: "Admin Logs",
    keywords: ["stakeholder", "log", "history"],
  },
  {
    name: "Transactions",
    path: "/admin/transaction",
    icon: DollarSign,
    description: "Manage financial transaction types and flows",
    category: "Admin Logs",
    keywords: ["transaction", "finance", "money"],
  },
];

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { hasPermission } = useAuth();

  // Check if user has admin access
  const hasAdminAccess = hasPermission("teams","can_write") || hasPermission("admin_config","can_write");

  // Build searchable items based on permissions
  const allItems = [
    ...opsItems,
    ...(hasAdminAccess ? adminConfigItems : []),
    ...(hasAdminAccess ? adminLogItems : []),
  ];

  // Filter items based on query
  const filteredItems = query.trim()
    ? allItems.filter((item) => {
        const searchLower = query.toLowerCase();
        return (
          item.name.toLowerCase().includes(searchLower) ||
          item.description.toLowerCase().includes(searchLower) ||
          item.category.toLowerCase().includes(searchLower) ||
          item.keywords?.some((k) => k.toLowerCase().includes(searchLower))
        );
      })
    : allItems.slice(0, 8); // Show first 8 items when no query

  // Group items by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, SearchItem[]>);

  // Flatten for keyboard navigation
  const flatItems = Object.values(groupedItems).flat();

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, flatItems.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (flatItems[selectedIndex]) {
            navigateTo(flatItems[selectedIndex].path);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, flatItems, onClose]);

  const navigateTo = useCallback(
    (path: string) => {
      router.push(path);
      onClose();
    },
    [router, onClose]
  );

  if (!isOpen) return null;

  return (
    <Portal>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] md:pt-[15vh] px-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Search modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-xl bg-background-primary border border-border-primary rounded-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border-primary">
              <Search className="h-5 w-5 text-foreground-tertiary shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Search modules, logs, settings..."
                className="flex-1 bg-transparent text-foreground-primary placeholder:text-foreground-tertiary outline-none text-base"
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  className="p-1 rounded hover:bg-surface-hover text-foreground-tertiary"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-foreground-tertiary bg-surface-secondary rounded border border-border-primary">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto">
              {flatItems.length === 0 ? (
                <div className="px-4 py-8 text-center text-foreground-secondary">
                  <Search className="h-8 w-8 mx-auto mb-2 text-foreground-tertiary" />
                  <p>No results found for &quot;{query}&quot;</p>
                </div>
              ) : (
                Object.entries(groupedItems).map(([category, items]) => (
                  <div key={category}>
                    <div className="px-4 py-2 text-xs font-semibold text-foreground-tertiary uppercase tracking-wider bg-surface-secondary">
                      {category}
                    </div>
                    {items.map((item) => {
                      const globalIndex = flatItems.indexOf(item);
                      const isSelected = globalIndex === selectedIndex;
                      const Icon = item.icon;

                      return (
                        <button
                          key={item.path}
                          onClick={() => navigateTo(item.path)}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                            isSelected
                              ? "bg-primary-50 dark:bg-primary-950/30"
                              : "hover:bg-surface-hover"
                          )}
                        >
                          <div
                            className={cn(
                              "shrink-0 p-2 rounded-lg",
                              isSelected
                                ? "bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400"
                                : "bg-surface-secondary text-foreground-secondary"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                "font-medium truncate",
                                isSelected
                                  ? "text-primary-700 dark:text-primary-300"
                                  : "text-foreground-primary"
                              )}
                            >
                              {item.name}
                            </p>
                            <p className="text-sm text-foreground-tertiary truncate">
                              {item.description}
                            </p>
                          </div>
                          {isSelected && (
                            <CaretRight className="h-4 w-4 text-primary-500 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer hints */}
            <div className="px-4 py-2 border-t border-border-primary bg-surface-secondary">
              <div className="flex items-center justify-between text-xs text-foreground-tertiary">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-background-primary border border-border-primary rounded text-[10px] font-medium shadow-sm">↑</kbd>
                    <kbd className="px-1.5 py-0.5 bg-background-primary border border-border-primary rounded text-[10px] font-medium shadow-sm">↓</kbd>
                    <span className="ml-1">Navigate</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-background-primary border border-border-primary rounded text-[10px] font-medium shadow-sm">Enter</kbd>
                    <span className="ml-1">Open</span>
                  </span>
                </div>
                <span className="hidden sm:flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-background-primary border border-border-primary rounded text-[10px] font-medium shadow-sm">Ctrl</kbd>
                  <span className="text-[10px]">+</span>
                  <kbd className="px-1.5 py-0.5 bg-background-primary border border-border-primary rounded text-[10px] font-medium shadow-sm">K</kbd>
                  <span className="ml-1">to open</span>
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </Portal>
  );
}
