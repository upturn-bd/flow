"use client";

import React from "react";
import { usePermissions } from "@/hooks/usePermissions";
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
  const { getModulePermissions, loading, hasAnyPermission } = usePermissions();
  const [isDismissed, setIsDismissed] = React.useState(false);

  if (loading || isDismissed) {
    return null;
  }

  const permissions = getModulePermissions(module);
  const hasAccess = hasAnyPermission(module);

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
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg px-4 py-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Info size={18} className="text-blue-600 flex-shrink-0" />
                <span className="text-sm font-medium text-blue-900 truncate">
                  Your {moduleName} Permissions:
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <PermissionsBadgeGroup permissions={permissions} iconOnly size="sm" />
                {dismissible && (
                  <button
                    onClick={() => setIsDismissed(true)}
                    className="text-blue-600 hover:text-blue-800 ml-2"
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
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Info size={24} weight="duotone" className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                  Your {moduleName} Access Level
                </h3>
                <p className="text-xs text-blue-700">
                  These are the actions you can perform in this module
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <PermissionsBadgeGroup permissions={permissions} size="md" />
              {dismissible && (
                <button
                  onClick={() => setIsDismissed(true)}
                  className="text-blue-600 hover:text-blue-800 text-xl font-bold ml-2"
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
