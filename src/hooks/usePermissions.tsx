"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import type { UserPermissions } from "@/lib/types/schemas";
import { PERMISSION_ACTIONS, type PermissionAction, type PermissionModule } from "@/lib/constants";
import { isSubordinate, fetchSubordinateIds } from "@/lib/utils/subordinates";

/**
 * Custom hook for checking user permissions based on team membership
 * Aggregates permissions from all teams a user belongs to
 */
export function usePermissions(employeeId?: string) {
  const { employeeInfo } = useAuth();
  const [permissions, setPermissions] = useState<UserPermissions>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch and aggregate permissions for the user
   * Uses the database function for optimized permission aggregation
   */
  const fetchPermissions = useCallback(async (empId?: string) => {
    setLoading(true);
    setError(null);

    try {
      const userId = empId || employeeId || employeeInfo?.id;
      if (!userId) {
        throw new Error('User ID not available');
      }

      // Call the database function to get aggregated permissions
      const { data, error: fetchError } = await supabase
        .rpc('get_user_permissions', { user_id: userId });

      if (fetchError) throw fetchError;

      // Transform array to object for easier lookups
      const permissionsMap: UserPermissions = {};
      (data || []).forEach((perm: any) => {
        permissionsMap[perm.module_name] = {
          can_read: perm.can_read,
          can_write: perm.can_write,
          can_delete: perm.can_delete,
          can_approve: perm.can_approve,
          can_comment: perm.can_comment,
        };
      });

      setPermissions(permissionsMap);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to fetch permissions";
      setError(errorMessage);
      console.error("Error fetching permissions:", err);
      setPermissions({});
    } finally {
      setLoading(false);
    }
  }, [employeeId, employeeInfo?.id]);

  // Fetch permissions on mount and when employeeId changes
  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  /**
   * Check if user has a specific permission for a module
   * @param module - The module name (e.g., 'tasks', 'projects')
   * @param action - The action to check (e.g., 'can_read', 'can_write')
   * @returns boolean indicating if user has the permission
   */
  const hasPermission = useCallback((
    module: PermissionModule | string,
    action: PermissionAction | string
  ): boolean => {
    if (!permissions[module]) return false;
    
    // Type-safe access to permission properties
    const actionKey = action as keyof typeof permissions[typeof module];
    return permissions[module][actionKey] === true;
  }, [permissions]);

  /**
   * Check if user can read a module
   */
  const canRead = useCallback((module: PermissionModule | string): boolean => {
    return hasPermission(module, PERMISSION_ACTIONS.READ);
  }, [hasPermission]);

  /**
   * Check if user can write to a module
   */
  const canWrite = useCallback((module: PermissionModule | string): boolean => {
    return hasPermission(module, PERMISSION_ACTIONS.WRITE);
  }, [hasPermission]);

  /**
   * Check if user can delete from a module
   */
  const canDelete = useCallback((module: PermissionModule | string): boolean => {
    return hasPermission(module, PERMISSION_ACTIONS.DELETE);
  }, [hasPermission]);

  /**
   * Check if user can approve in a module
   */
  const canApprove = useCallback((module: PermissionModule | string): boolean => {
    return hasPermission(module, PERMISSION_ACTIONS.APPROVE);
  }, [hasPermission]);

  /**
   * Check if user can comment in a module
   */
  const canComment = useCallback((module: PermissionModule | string): boolean => {
    return hasPermission(module, PERMISSION_ACTIONS.COMMENT);
  }, [hasPermission]);

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
   * Refresh permissions (useful after team membership changes)
   */
  const refreshPermissions = useCallback(async () => {
    await fetchPermissions();
  }, [fetchPermissions]);

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
    loading,
    error,

    // Core permission checks
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
    error,
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

/**
 * Hook for checking permissions without automatic fetching
 * Useful when you already have permissions from context
 */
export function usePermissionChecks(userPermissions: UserPermissions) {
  const hasPermission = useCallback((
    module: PermissionModule | string,
    action: PermissionAction | string
  ): boolean => {
    if (!userPermissions[module]) return false;
    const actionKey = action as keyof typeof userPermissions[typeof module];
    return userPermissions[module][actionKey] === true;
  }, [userPermissions]);

  const canRead = useCallback((module: PermissionModule | string): boolean => {
    return hasPermission(module, PERMISSION_ACTIONS.READ);
  }, [hasPermission]);

  const canWrite = useCallback((module: PermissionModule | string): boolean => {
    return hasPermission(module, PERMISSION_ACTIONS.WRITE);
  }, [hasPermission]);

  const canDelete = useCallback((module: PermissionModule | string): boolean => {
    return hasPermission(module, PERMISSION_ACTIONS.DELETE);
  }, [hasPermission]);

  const canApprove = useCallback((module: PermissionModule | string): boolean => {
    return hasPermission(module, PERMISSION_ACTIONS.APPROVE);
  }, [hasPermission]);

  const canComment = useCallback((module: PermissionModule | string): boolean => {
    return hasPermission(module, PERMISSION_ACTIONS.COMMENT);
  }, [hasPermission]);

  return useMemo(() => ({
    hasPermission,
    canRead,
    canWrite,
    canDelete,
    canApprove,
    canComment,
  }), [hasPermission, canRead, canWrite, canDelete, canApprove, canComment]);
}
