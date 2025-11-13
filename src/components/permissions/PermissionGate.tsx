"use client";

import React from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { PermissionModule, PermissionAction } from "@/lib/constants";

interface PermissionGateProps {
  module: PermissionModule | string;
  action: PermissionAction | string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  /**
   * If true, shows children but in a disabled/muted state
   * If false (default), hides children when permission is denied
   */
  showDisabled?: boolean;
}

/**
 * Component that conditionally renders children based on user permissions
 * 
 * Usage:
 * ```tsx
 * <PermissionGate module="tasks" action="can_write">
 *   <Button>Create Task</Button>
 * </PermissionGate>
 * ```
 */
export function PermissionGate({
  module,
  action,
  children,
  fallback = null,
  showDisabled = false,
}: PermissionGateProps) {
  const { hasPermission, loading } = usePermissions();

  if (loading) {
    return null; // or a skeleton loader
  }

  const permitted = hasPermission(module, action);

  if (!permitted) {
    if (showDisabled) {
      // Render children but in a disabled/muted state
      return (
        <div className="opacity-50 pointer-events-none cursor-not-allowed">
          {children}
        </div>
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface PermissionAwareProps {
  module: PermissionModule | string;
  action: PermissionAction | string;
  children: (permitted: boolean, loading: boolean) => React.ReactNode;
}

/**
 * Render prop component for permission-aware rendering
 * 
 * Usage:
 * ```tsx
 * <PermissionAware module="tasks" action="can_write">
 *   {(permitted, loading) => (
 *     <Button disabled={!permitted || loading}>
 *       {permitted ? "Create Task" : "No Permission"}
 *     </Button>
 *   )}
 * </PermissionAware>
 * ```
 */
export function PermissionAware({
  module,
  action,
  children,
}: PermissionAwareProps) {
  const { hasPermission, loading } = usePermissions();
  const permitted = hasPermission(module, action);

  return <>{children(permitted, loading)}</>;
}
