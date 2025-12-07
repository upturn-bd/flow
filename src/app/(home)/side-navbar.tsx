"use client";

import { cn } from "@/components/ui/class";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { CaretLeft, CaretRight, List, X } from "@phosphor-icons/react";

export default function Sidebar() {
  const { isApproved, getAuthorizedNavItems } = useAuth();
  const pathname = usePathname();
  const navItems = getAuthorizedNavItems();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close mobile sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const toggleMobile = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  if (!isApproved) return null;

  const getDisplayLabel = (label: string) => {
    switch (label) {
      case "home":
        return "Dashboard";
      case "profile":
        return "My Profile";
      case "operations-and-services":
        return "Operations";
      case "admin":
        return "Admin";
      default:
        return label.charAt(0).toUpperCase() + label.slice(1).replace(/-/g, " ");
    }
  };

  const NavLink = ({ item, collapsed }: { item: typeof navItems[0]; collapsed: boolean }) => {
    const displayLabel = getDisplayLabel(item.label);
    const Icon = item.icon;
    const isActive = pathname.startsWith(item.href);

    return (
      <Link
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
          isActive
            ? "bg-primary-600 text-white shadow-sm"
            : "text-foreground-secondary hover:bg-surface-hover hover:text-foreground-primary"
        )}
        title={collapsed ? displayLabel : undefined}
      >
        <span className={cn(
          "shrink-0 transition-transform duration-200",
          !isActive && "group-hover:scale-110"
        )}>
          <Icon size={20} weight={isActive ? "fill" : "regular"} />
        </span>
        
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              className="text-sm font-medium whitespace-nowrap overflow-hidden"
            >
              {displayLabel}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Tooltip for collapsed state */}
        {collapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-foreground-primary text-background-primary text-xs font-medium rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
            {displayLabel}
          </div>
        )}
      </Link>
    );
  };

  const SidebarContent = ({ collapsed, showCollapseButton = true }: { collapsed: boolean; showCollapseButton?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={cn(
        "flex items-center h-16 border-b border-border-primary",
        collapsed ? "justify-start" : "justify-between pr-3"
      )}>
        <Link href="/home" className="flex items-center gap-2">
          <div className="w-16 h-16 bg-primary-600 dark:bg-primary-800 flex items-center justify-center shrink-0 overflow-hidden">
            <Image
              src="/nav-logo.png"
              width={14}
              height={14}
              alt="Logo"
              className="object-cover w-8 h-8"
            />
          </div>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-foreground-primary font-semibold text-base truncate"
            >
              Upturn Flow
            </motion.span>
          )}
        </Link>
        
        {showCollapseButton && !collapsed && (
          <button
            onClick={toggleCollapse}
            className="p-1.5 rounded-md text-foreground-tertiary hover:text-foreground-primary hover:bg-surface-hover transition-colors shrink-0"
            aria-label="Collapse sidebar"
          >
            <CaretLeft size={18} />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {showCollapseButton && collapsed && (
        <div className="flex justify-center py-3">
          <button
            onClick={toggleCollapse}
            className="p-1.5 rounded-md text-foreground-tertiary hover:text-foreground-primary hover:bg-surface-hover transition-colors"
            aria-label="Expand sidebar"
          >
            <CaretRight size={18} />
          </button>
        </div>
      )}

      {/* NavigationArrow */}
      <nav className={cn(
        "flex-1 overflow-y-auto overflow-x-hidden py-4",
        collapsed ? "px-2" : "px-3"
      )}>
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.label} item={item} collapsed={collapsed} />
          ))}
        </div>
      </nav>

      {/* Footer area - can be used for user info or settings */}
      <div className={cn(
        "border-t border-border-primary py-3",
        collapsed ? "px-2" : "px-3"
      )}>
        {/* Placeholder for future footer content */}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger button - positioned above top bar but below modals */}
      <button
        data-mobile-hamburger
        className={cn(
          "md:hidden fixed top-4 left-4 z-45 p-2 rounded-lg transition-all duration-200",
          "bg-surface-primary border border-border-primary shadow-md",
          "text-foreground-secondary hover:text-foreground-primary hover:bg-surface-hover",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        )}
        onClick={toggleMobile}
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? <X size={20} /> : <List size={20} />}
      </button>

      {/* Mobile sidebar overlay and panel */}
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm md:hidden z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            
            {/* Mobile sidebar panel */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className={cn(
              "fixed top-0 left-0 h-full w-72 z-50",
              "bg-background-tertiary border-r border-border-primary shadow-2xl"
              )}
              role="dialog"
              aria-modal="true"
              aria-label="NavigationArrow menu"
            >
              {/* Close button inside mobile sidebar */}
              <button
              className="absolute top-4 right-4 p-2 rounded-lg text-foreground-tertiary hover:text-foreground-primary hover:bg-surface-hover transition-colors"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              >
              <X size={20} />
              </button>
              
              <SidebarContent collapsed={false} showCollapseButton={false} />
            </motion.aside>
          </>
        )}

      {/* Desktop sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 64 : 240 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className={cn(
          "hidden md:flex md:flex-col md:h-screen md:sticky md:top-0",
          "bg-background-secondary border-r border-border-primary",
          "shrink-0"
        )}
      >
        <SidebarContent collapsed={isCollapsed} />
      </motion.aside>
    </>
  );
}
