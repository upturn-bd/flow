"use client";

import React from "react";
import { LockKey, ShieldWarning } from "@phosphor-icons/react";
import { motion } from "framer-motion";

interface PermissionEmptyStateProps {
  /** Title of the empty state */
  title?: string;
  /** Description message */
  message?: string;
  /** Module name for context */
  moduleName?: string;
  /** Action required */
  actionRequired?: string;
  /** Icon to display */
  icon?: "lock" | "warning";
}

/**
 * Empty state component for when users don't have permission to view content
 * 
 * Usage:
 * ```tsx
 * <PermissionEmptyState
 *   moduleName="Tasks"
 *   actionRequired="view"
 * />
 * ```
 */
export function PermissionEmptyState({
  title = "Access Restricted",
  message,
  moduleName = "this resource",
  actionRequired = "access",
  icon = "lock",
}: PermissionEmptyStateProps) {
  const IconComponent = icon === "lock" ? Lock : ShieldWarning;
  const defaultMessage = message || `You don't have permission to ${actionRequired} ${moduleName}. Please contact your administrator if you believe you should have access.`;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center max-w-md"
      >
        <div className="mb-6">
          <IconComponent
            size={80}
            weight="duotone"
            className="text-foreground-tertiary mx-auto"
          />
        </div>
        
        <h3 className="text-2xl font-semibold text-foreground-primary mb-3">
          {title}
        </h3>
        
        <p className="text-foreground-secondary mb-6 leading-relaxed">
          {defaultMessage}
        </p>

        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ShieldWarning size={20} className="text-primary-500 shrink-0 mt-0.5" />
            <div className="text-left">
              <h4 className="text-sm font-semibold text-primary-800 dark:text-primary-200 mb-1">
                Need Access?
              </h4>
              <p className="text-sm text-primary-700 dark:text-primary-300">
                Contact your team administrator or HR department to request access to this feature.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
