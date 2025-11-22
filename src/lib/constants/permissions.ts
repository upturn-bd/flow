/**
 * Permission System Constants
 * Type-safe route-to-permission mappings for middleware
 */

import { PERMISSION_MODULES, PERMISSION_ACTIONS } from "./index";
import type { PermissionModule, PermissionAction } from "./index";

export interface RoutePermission {
  module: PermissionModule;
  action: PermissionAction;
}

/**
 * Route-based permission requirements
 * Used by middleware to enforce access control
 */
export const ROUTE_PERMISSION_MAP: Record<string, RoutePermission> = {
  "/admin": { 
    module: PERMISSION_MODULES.TEAMS, 
    action: PERMISSION_ACTIONS.WRITE 
  },
  "/finder": { 
    module: PERMISSION_MODULES.HRIS, 
    action: PERMISSION_ACTIONS.READ 
  },
} as const;

/**
 * Permission interface matching database RPC return type
 */
export interface Permission {
  module_name: string;
  can_read: boolean;
  can_write: boolean;
  can_delete: boolean;
  can_approve: boolean;
  can_comment?: boolean;
}
