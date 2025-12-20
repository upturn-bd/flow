"use client";

import React from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { PermissionModule, PERMISSION_MODULES } from "@/lib/constants";
import { PermissionsBadgeGroup } from "./PermissionBadge";
import { Info } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";

interface ModulePermissionsBannerProps {
  /** The module to display permissions for */
  module: PermissionModule | string;
  /** Optional custom title */
  title?: string;
  /** Show as compact banner */
  compact?: boolean;
  /** Allow dismissing the banner */
  dismissible?: boolean;
}

/**
 * Banner component that displays the user's permissions for a specific module
 * Shows at the top of module pages to give users clear visibility of their access level
 * 
 * Usage:
 * ```tsx
 * <ModulePermissionsBanner module="tasks" />
 * ```
 */
export function ModulePermissionsBanner({
  module,
  title,
  compact = false,
  dismissible = false,
}: ModulePermissionsBannerProps) {
  const { permissions, permissionsLoading } = useAuth();
  const [isDismissed, setIsDismissed] = React.useState(false);

  if (permissionsLoading || isDismissed) {
    return null;
  }

  const modulePermissions = permissions[module] || {
    can_read: false,
    can_write: false,
    can_delete: false,
    can_approve: false,
    can_comment: false,
  };
  
  const hasAccess = modulePermissions.can_read || 
                    modulePermissions.can_write || 
                    modulePermissions.can_delete || 
                    modulePermissions.can_approve || 
                    modulePermissions.can_comment;

  // Don't show banner if user has no permissions at all
  if (!hasAccess) {
    return null;
  }

  const moduleName = title || module.charAt(0).toUpperCase() + module.slice(1);

  if (compact) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mb-4"
        >
          <div className="bg-linear-to-r from-primary-50 to-indigo-50 dark:from-primary-900/20 dark:to-indigo-900/20 border border-primary-100 dark:border-primary-800 rounded-lg px-4 py-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Info size={18} className="text-primary-600 dark:text-primary-400 shrink-0" />
                <span className="text-sm font-medium text-primary-900 dark:text-primary-100 truncate">
                  Your {moduleName} Permissions:
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <PermissionsBadgeGroup permissions={modulePermissions} iconOnly size="sm" />
                {dismissible && (
                  <button
                    onClick={() => setIsDismissed(true)}
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 ml-2"
                    aria-label="Dismiss"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mb-6"
      >
        <div className="bg-linear-to-r from-primary-50 to-indigo-50 dark:from-primary-900/20 dark:to-indigo-900/20 border border-primary-100 dark:border-primary-800 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Info size={24} weight="duotone" className="text-primary-600 dark:text-primary-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-primary-900 dark:text-primary-100 mb-1">
                  Your {moduleName} Access Level
                </h3>
                <p className="text-xs text-primary-700 dark:text-primary-300">
                  These are the actions you can perform in this module
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <PermissionsBadgeGroup permissions={modulePermissions} size="md" />
              {dismissible && (
                <button
                  onClick={() => setIsDismissed(true)}
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 text-xl font-bold ml-2"
                  aria-label="Dismiss"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
