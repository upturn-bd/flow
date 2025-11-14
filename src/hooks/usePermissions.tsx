"use client";

import { useCallback, useMemo } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import type { UserPermissions } from "@/lib/types/schemas";
import { PERMISSION_ACTIONS, type PermissionAction, type PermissionModule } from "@/lib/constants";
import { isSubordinate, fetchSubordinateIds } from "@/lib/utils/subordinates";

/**
 * Hook for permission checks with supervisor-related functionality
 * 
 * ⚠️ USAGE GUIDANCE:
 * - For basic permission checks (hasPermission, canRead, canWrite, etc.) → Use useAuth() directly
 * - For supervisor functionality (isSupervisorOf, getSubordinates, canManageSubordinate) → Use this hook
 * 
 * This hook no longer fetches permissions independently. It uses permissions from AuthContext
 * to avoid redundant API calls. Permissions are fetched once when the user logs in.
 * 
 * @param employeeId - Optional. Employee ID to check permissions for. Defaults to current user.
 *                     Only needed when checking permissions for a different user than the logged-in user.
 * 
 * @example Basic Permission Checks (use useAuth instead)
 * ```tsx
 * // ✅ RECOMMENDED
 * const { canWrite, canDelete } = useAuth();
 * 
 * // ⚠️ WORKS BUT REDUNDANT
 * const { canWrite, canDelete } = usePermissions();
 * ```
 * 
 * @example Supervisor Functionality (use this hook)
 * ```tsx
 * // ✅ CORRECT USE CASE
 * const { isSupervisorOf, getSubordinates } = usePermissions();
 * const isManager = await isSupervisorOf(employeeId);
 * const myTeam = await getSubordinates();
 * ```
 */
export function usePermissions(employeeId?: string) {
  const { 
    employeeInfo, 
    permissions, 
    permissionsLoading: loading,
    hasPermission,
    canRead,
    canWrite,
    canDelete,
    canApprove,
    canComment,
    refreshPermissions
  } = useAuth();

  /**
   * Check if user has any permission for a module
   */
  const hasAnyPermission = useCallback((module: PermissionModule | string): boolean => {
    if (!permissions[module]) return false;
    
    const modulePerms = permissions[module];
    return modulePerms.can_read || 
           modulePerms.can_write || 
           modulePerms.can_delete || 
           modulePerms.can_approve || 
           modulePerms.can_comment;
  }, [permissions]);

  /**
   * Check if user has all specified permissions for a module
   */
  const hasAllPermissions = useCallback((
    module: PermissionModule | string,
    actions: PermissionAction[]
  ): boolean => {
    return actions.every(action => hasPermission(module, action));
  }, [hasPermission]);

  /**
   * Check if user has any of the specified permissions for a module
   */
  const hasAnyOfPermissions = useCallback((
    module: PermissionModule | string,
    actions: PermissionAction[]
  ): boolean => {
    return actions.some(action => hasPermission(module, action));
  }, [hasPermission]);

  /**
   * Get all modules the user has access to
   */
  const getAccessibleModules = useCallback((): string[] => {
    return Object.keys(permissions).filter(module => hasAnyPermission(module));
  }, [permissions, hasAnyPermission]);

  /**
   * Get all modules where user has a specific action
   */
  const getModulesWithAction = useCallback((action: PermissionAction): string[] => {
    return Object.keys(permissions).filter(module => 
      hasPermission(module, action)
    );
  }, [permissions, hasPermission]);

  /**
   * Get full permission object for a module
   */
  const getModulePermissions = useCallback((module: PermissionModule | string) => {
    return permissions[module] || {
      can_read: false,
      can_write: false,
      can_delete: false,
      can_approve: false,
      can_comment: false,
    };
  }, [permissions]);

  /**
   * Check if user is in admin team (has team management permissions)
   */
  const isAdmin = useCallback((): boolean => {
    return hasPermission('teams', PERMISSION_ACTIONS.WRITE);
  }, [hasPermission]);

  /**
   * Check if user can manage a specific operational module
   */
  const canManageOperations = useCallback((): boolean => {
    return canWrite('onboarding') || canWrite('offboarding') || canWrite('hris');
  }, [canWrite]);

  /**
   * Check if current user is supervisor of target employee (direct or indirect)
   * @param targetEmployeeId - The employee ID to check
   * @returns Promise<boolean> - True if current user is supervisor of target employee
   */
  const isSupervisorOf = useCallback(async (targetEmployeeId: string): Promise<boolean> => {
    try {
      const userId = employeeId || employeeInfo?.id;
      const companyId = employeeInfo?.company_id;
      if (!userId || !companyId) {
        throw new Error('User ID or Company ID not available');
      }
      
      // Convert company_id to number if it's a string
      const companyIdNum = typeof companyId === 'string' ? parseInt(companyId, 10) : companyId;
      
      return await isSubordinate(targetEmployeeId, userId, companyIdNum);
    } catch (error) {
      console.error("Error checking supervisor relationship:", error);
      return false;
    }
  }, [employeeId, employeeInfo?.id, employeeInfo?.company_id]);

  /**
   * Get all subordinate IDs for current user
   * @param includeIndirect - Whether to include indirect reports (default: true)
   * @returns Promise<string[]> - Array of subordinate employee IDs
   */
  const getSubordinates = useCallback(async (includeIndirect: boolean = true): Promise<string[]> => {
    try {
      const userId = employeeId || employeeInfo?.id;
      const companyId = employeeInfo?.company_id;
      if (!userId || !companyId) {
        throw new Error('User ID or Company ID not available');
      }
      
      // Convert company_id to number if it's a string
      const companyIdNum = typeof companyId === 'string' ? parseInt(companyId, 10) : companyId;
      
      return await fetchSubordinateIds(userId, companyIdNum, includeIndirect);
    } catch (error) {
      console.error("Error fetching subordinates:", error);
      return [];
    }
  }, [employeeId, employeeInfo?.id, employeeInfo?.company_id]);

  /**
   * Check if user can manage subordinate based on EITHER team permission OR supervisor relationship
   * @param targetEmployeeId - The employee to check management permissions for
   * @param module - The module name (e.g., 'leave', 'attendance')
   * @param action - The action to check (e.g., 'can_approve', 'can_write')
   * @returns Promise<boolean> - True if user can manage based on team permission OR supervisor relationship
   */
  const canManageSubordinate = useCallback(async (
    targetEmployeeId: string,
    module: PermissionModule | string,
    action: PermissionAction | string
  ): Promise<boolean> => {
    try {
      // Check team permission first (fastest)
      if (hasPermission(module, action)) {
        return true;
      }

      // Check supervisor relationship
      return await isSupervisorOf(targetEmployeeId);
    } catch (error) {
      console.error("Error checking subordinate management permission:", error);
      return false;
    }
  }, [hasPermission, isSupervisorOf]);

  return useMemo(() => ({
    // State
    permissions,
    loading, // Deprecated: use permissionsLoading instead
    permissionsLoading: loading, // Consistent with AuthContext naming

    // Core permission checks (from AuthContext)
    hasPermission,
    canRead,
    canWrite,
    canDelete,
    canApprove,
    canComment,

    // Advanced checks
    hasAnyPermission,
    hasAllPermissions,
    hasAnyOfPermissions,

    // Utility functions
    getAccessibleModules,
    getModulesWithAction,
    getModulePermissions,
    isAdmin,
    canManageOperations,

    // Supervisor permissions
    isSupervisorOf,
    getSubordinates,
    canManageSubordinate,

    // Refresh
    refreshPermissions,
  }), [
    permissions,
    loading,
    hasPermission,
    canRead,
    canWrite,
    canDelete,
    canApprove,
    canComment,
    hasAnyPermission,
    hasAllPermissions,
    hasAnyOfPermissions,
    getAccessibleModules,
    getModulesWithAction,
    getModulePermissions,
    isAdmin,
    canManageOperations,
    isSupervisorOf,
    getSubordinates,
    canManageSubordinate,
    refreshPermissions,
  ]);
}
