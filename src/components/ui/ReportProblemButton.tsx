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

  const baseClasses = "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-error focus:ring-offset-2";
  
  const variantClasses = {
    default: "px-4 py-2 text-sm bg-error/10 dark:bg-error/20 text-error dark:text-error hover:bg-error/20 dark:hover:bg-error/30 border border-error/30 dark:border-error/40",
    compact: "px-3 py-1.5 text-xs bg-error/10 dark:bg-error/20 text-error dark:text-error hover:bg-error/20 dark:hover:bg-error/30 border border-error/30 dark:border-error/40",
    "icon-only": "p-2 bg-error/10 dark:bg-error/20 text-error dark:text-error hover:bg-error/20 dark:hover:bg-error/30 border border-error/30 dark:border-error/40",
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
