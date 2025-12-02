"use client";

import { ReactNode } from "react";
import { motion, Variants } from "framer-motion";

export interface PageFrameProps {
  children: ReactNode;
  className?: string;
  /** Whether to animate the page entry */
  animate?: boolean;
  /** Custom animation variants */
  variants?: Variants;
  /** Extra bottom padding for mobile navigation */
  mobileNavPadding?: boolean;
}

/**
 * PageFrame - A consistent page container with responsive padding
 * 
 * Provides the standard responsive padding pattern used across the app:
 * - Mobile (default): p-4
 * - Tablet (sm): p-6
 * - Desktop (lg): p-8
 * 
 * Use this component to wrap page content for consistent spacing.
 */
export function PageFrame({
  children,
  className = "",
  animate = true,
  variants,
  mobileNavPadding = false,
}: PageFrameProps) {
  const defaultVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: {
        duration: 0.2,
      },
    },
  };

  // Standard responsive padding class
  const paddingClass = mobileNavPadding
    ? "p-4 sm:p-6 lg:p-8 pb-12"
    : "p-4 sm:p-6 lg:p-8";

  if (animate) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={variants || defaultVariants}
        className={`w-full ${paddingClass} ${className}`}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={`w-full ${paddingClass} ${className}`}>
      {children}
    </div>
  );
}
