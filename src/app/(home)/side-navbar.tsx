"use client";

import { cn } from "@/components/ui/class";
import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  BarChart,
  LogIn,
  CalendarX,
  Bell,
  Clipboard,
  DollarSign,
  AlertCircle,
  Settings,
  UserPlus,
  Users,
} from "lucide-react";

export default function Sidebar() {
  const { isApproved, getAuthorizedNavItems } = useAuth();
  const pathname = usePathname();
  const navItems = getAuthorizedNavItems();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // track submenu toggle
  const [openSubmenu, setOpenSubmenu] = useState<string | null>('operations-and-services');

  // auto-open submenu if user is inside operations-and-services/*
  useEffect(() => {
    if (pathname.startsWith("/operations-and-services")) {
      setOpenSubmenu("operations-and-services");
    }
  }, [pathname]);

  if (!isApproved) return null;

  // Submenu items for Operations & Services
  const operationsSubmenu = [
    { label: "Task", desc: "Assign, track and manage day-to-day tasks", href: "/operations-and-services/workflow/task", icon: ClipboardList },
    { label: "Project", desc: "Plan and execute complex projects with milestones", href: "/operations-and-services/workflow/project", icon: BarChart },
    { label: "Attendance", desc: "Track and manage your daily attendance", href: "/operations-and-services/services/attendance", icon: LogIn },
    { label: "Leave", desc: "Apply and manage time off and leaves", href: "/operations-and-services/services/leave", icon: CalendarX },
    { label: "Notice", desc: "Important company announcements and notices", href: "/operations-and-services/services/notice", icon: Bell },
    { label: "Requisition", desc: "Request equipment, supplies and services", href: "/operations-and-services/services/requisition", icon: Clipboard },
    { label: "Settlement", desc: "Manage and track expense reimbursements", href: "/operations-and-services/services/settlement", icon: DollarSign },
    { label: "Complaint", desc: "Submit and track workplace issues and concerns", href: "/operations-and-services/services/complaint", icon: AlertCircle },
    { label: "Onboarding", desc: "Employee onboarding workflow and tasks", href: "/operations-and-services/services/onboarding", icon: UserPlus },
    { label: "HRIS", desc: "Human Resource Information System", href: "/operations-and-services/services/hris", icon: Users },
  ];
  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "sticky top-0 h-screen z-40 shadow-xl flex flex-col",
        "bg-gradient-to-b from-[#001731] to-[#002363]",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo Section */}
      <div className="flex items-center justify-between px-4 py-6">
        <Link href="/home" className="flex items-center space-x-3">
          <Image
            src="/nav-logo.png"
            width={40}
            height={40}
            alt="Logo"
            className="object-contain"
          />
          {!isCollapsed && (
            <span className="text-white text-lg font-semibold tracking-wide px-2">
              Upturn Flow
            </span>
          )}
        </Link>

        {/* Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-md text-gray-300 hover:text-white hover:bg-[#001c4f] transition-colors"
        >
          {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col mt-4 space-y-2 px-2 flex-1 overflow-y-auto">
        {navItems.map((item) => {
          console.log(item)
          let displayLabel;
          switch (item.label) {
            case 'home':
              displayLabel = "Dashboard";
              break;
            case "hris":
              displayLabel = "My Profile";
              break;
            case "operations-and-services":
              displayLabel = "Operations & Services";
              break;
            case "admin-management":
              displayLabel = "Company Configuration";
              break;
            default:
              displayLabel = item.label
                .charAt(0)
                .toUpperCase()
                .concat(item.label.slice(1).replace(/-/g, " "));
          }

          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          // special handling for Operations & Services
          if (item.label === "operations-and-services") {
            return (
              <div key={item.label} className="relative">
                <div
                  className={cn(
                    "flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-yellow-400 text-black font-medium"
                      : "text-gray-300 hover:text-white hover:bg-[#001c4f]"
                  )}
                >
                  {/* Left Section: Link to main page */}
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 flex-1"
                  >
                    <Icon size={22} weight={isActive ? "fill" : "regular"} />
                    {!isCollapsed && <span>{displayLabel}</span>}
                  </Link>

                  {/* Right Section: Chevron toggle */}
                  {!isCollapsed && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenSubmenu(
                          openSubmenu === item.label ? null : item.label
                        );
                      }}
                      className="ml-2"
                    >
                      {openSubmenu === item.label ? (
                        <ChevronUp size={18} />
                      ) : (
                        <ChevronDown size={18} />
                      )}
                    </button>
                  )}
                </div>

                {/* Submenu */}
                <AnimatePresence>
                  {openSubmenu === item.label && !isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="ml-10 mt-4 flex flex-col gap-1"
                    >
                      {operationsSubmenu.map((sub) => {
                        const subActive = pathname.startsWith(sub.href);
                        const SubIcon = sub.icon;
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={cn(
                              "px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2",
                              subActive
                                ? "bg-[#3645637a] text-white font-medium"
                                : "text-gray-300 hover:text-white hover:bg-[#36456357]"
                            )}
                          >
                            <SubIcon size={18} />
                            <span>{sub.label}</span>
                          </Link>
                        );
                      })}

                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          // default rendering for other menu items
          return (
            <motion.div
              key={item.label}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative"
            >
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  isActive
                    ? "bg-yellow-400 text-black font-medium"
                    : "text-gray-300 hover:text-white hover:bg-[#001c4f]"
                )}
                title={displayLabel}
              >
                <Icon size={22} weight={isActive ? "fill" : "regular"} />
                {!isCollapsed && <span>{displayLabel}</span>}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto mb-6 px-4">
        <Link href={"/settings"}>
          <div
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors",
              "text-gray-300 hover:text-white hover:bg-[#001c4f]"
            )}
          >
            <Settings size={22} />
            {!isCollapsed && <span className="text-sm">Settings</span>}
          </div>
        </Link>

      </div>
    </motion.aside>
  );
}
