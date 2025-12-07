"use client";

import React, { useState } from "react";
import { LockKey } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";

interface PermissionTooltipProps {
  children: React.ReactNode;
  message?: string;
  /** If true, shows the lock icon and tooltip */
  showLock?: boolean;
  /** Position of the tooltip */
  position?: "top" | "bottom" | "left" | "right";
}

/**
 * Tooltip component that shows permission-related messages
 * 
 * Usage:
 * ```tsx
 * <PermissionTooltip message="You don't have permission to create tasks" showLock>
 *   <Button disabled>Create Task</Button>
 * </PermissionTooltip>
 * ```
 */
export function PermissionTooltip({
  children,
  message = "You don't have permission to perform this action",
  showLock = true,
  position = "top",
}: PermissionTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  if (!showLock) {
    return <>{children}</>;
  }

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <div className="flex items-center gap-2">
        {children}
        <LockKey size={16} className="text-foreground-tertiary shrink-0" />
      </div>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute ${positionClasses[position]} z-50 pointer-events-none`}
          >
            <div className="bg-foreground-primary text-background-primary text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap max-w-xs">
              <div className="flex items-center gap-2">
                <LockKey size={14} />
                <span>{message}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
