"use client";

import { useState } from "react";
import { Bug } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import ReportProblemModal from "./ReportProblemModal";

interface ReportProblemButtonProps {
  moduleName?: string;
  moduleCategory?: string;
  variant?: "default" | "compact" | "icon-only";
  className?: string;
}

export default function ReportProblemButton({
  moduleName,
  moduleCategory,
  variant = "default",
  className = "",
}: ReportProblemButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const baseClasses = "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2";
  
  const variantClasses = {
    default: "px-4 py-2 text-sm bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800",
    compact: "px-3 py-1.5 text-xs bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800",
    "icon-only": "p-2 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800",
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsModalOpen(true)}
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        title="Report a problem"
      >
        <Bug size={variant === "default" ? 18 : variant === "compact" ? 14 : 18} />
        {variant !== "icon-only" && (
          <span>Report Problem</span>
        )}
      </motion.button>

      <ReportProblemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        moduleName={moduleName}
        moduleCategory={moduleCategory}
      />
    </>
  );
}
