"use client";

import { cn } from "@/components/ui/class";
import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import {
  CaretLeft,
  CaretRight,
  List,
  X,
} from "@/lib/icons";

export default function Sidebar() {
  const { isApproved, getAuthorizedNavItems } = useAuth();
  const pathname = usePathname();
  const navItems = getAuthorizedNavItems();

  const [isCollapsed, setIsCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  if (!isApproved) return null;

  const HamburgerButton = () => (
    <button
      className="md:hidden fixed top-4 left-4 z-[1001] p-2 rounded-md bg-[#001731] text-white"
      onClick={() => {
        setMobileOpen(!mobileOpen)
        setIsCollapsed(false)
      }}
    >
      {mobileOpen ? <X size={24} /> : <List size={24} />}
    </button>
  );

  const SidebarContent = (
    <div className="flex flex-col h-full">
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
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-md text-gray-300 hover:text-white hover:bg-[#001c4f] transition-colors"
        >
          {isCollapsed ? <CaretRight /> : <CaretLeft />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col mt-4 space-y-2 px-2 flex-1 overflow-y-auto sidebar-scrollbar">
        {navItems.map((item) => {
          let displayLabel;
          switch (item.label) {
            case "home":
              displayLabel = "Dashboard";
              break;
            case "profile":
              displayLabel = "My Profile";
              break;
            case "operations-and-services":
              displayLabel = "Operations & Services";
              break;
            case "admin":
              displayLabel = "Admin Management";
              break;
            default:
              displayLabel =
                item.label.charAt(0).toUpperCase() +
                item.label.slice(1).replace(/-/g, " ");
          }

          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

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
                <Icon size={22} />
                {!isCollapsed && <span>{displayLabel}</span>}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto mb-6 px-4">
        {/* <Link href={"/settings"}>
          <div
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors",
              "text-gray-300 hover:text-white hover:bg-[#001c4f]"
            )}
          >
            <Settings size={22} />
            {!isCollapsed && <span className="text-sm">Settings</span>}
          </div>
        </Link> */}
      </div>
    </div>
  );

  return (
    <>
      <HamburgerButton />

      {/* Mobile sidebar with overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/30 md:hidden z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "fixed top-0 left-0 h-full z-50 shadow-xl",
                "bg-gradient-to-b from-[#001731] to-[#002363]",
                isCollapsed ? "w-20" : "w-64"
              )}
            >
              {SidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex md:flex-col md:h-screen md:sticky md:top-0 shadow-xl",
          "bg-gradient-to-b from-[#001731] to-[#002363]",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {SidebarContent}
      </aside>
    </>
  );
}
