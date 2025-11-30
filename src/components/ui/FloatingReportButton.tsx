"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Bug } from "@/lib/icons";
import { motion, AnimatePresence } from "framer-motion";
import ReportProblemModal from "./ReportProblemModal";

// Routes where the floating report button should appear
const ENABLED_ROUTES = ["/ops", "/admin"];

// Get module info from pathname
function getModuleInfo(pathname: string): { moduleName: string; moduleCategory: string } {
  const segments = pathname.split("/").filter(Boolean);
  
  if (segments[0] === "ops") {
    const moduleName = segments[1] 
      ? segments[1].split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
      : "Operations";
    return { moduleName, moduleCategory: "Operations" };
  }
  
  if (segments[0] === "admin") {
    if (segments[1] === "logs" && segments[2]) {
      const moduleName = segments[2].split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") + " Log";
      return { moduleName, moduleCategory: "Admin Logs" };
    }
    if (segments[1] === "config" && segments[2]) {
      const moduleName = segments[2].split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      return { moduleName, moduleCategory: "Admin Config" };
    }
    if (segments[1]) {
      const moduleName = segments[1].split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      return { moduleName, moduleCategory: "Admin" };
    }
    return { moduleName: "Admin", moduleCategory: "Admin" };
  }
  
  return { moduleName: "General", moduleCategory: "General" };
}

export default function FloatingReportButton() {
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Check if button should be visible based on current route
  useEffect(() => {
    const shouldShow = ENABLED_ROUTES.some(route => pathname.startsWith(route));
    setIsVisible(shouldShow);
  }, [pathname]);

  const { moduleName, moduleCategory } = getModuleInfo(pathname);

  if (!isVisible) return null;

  return (
    <>
      <AnimatePresence>
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 flex items-center gap-2 px-4 py-3 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          title="Report a problem"
        >
          <Bug size={20} />
          <span className="text-sm font-medium hidden sm:inline">Report Problem</span>
        </motion.button>
      </AnimatePresence>

      <ReportProblemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        moduleName={moduleName}
        moduleCategory={moduleCategory}
      />
    </>
  );
}
