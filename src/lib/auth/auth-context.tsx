"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { navItems } from "@/app/(home)/nav-items";
import { getEmployeeInfo } from "../utils/auth";
import type { UserPermissions } from "@/lib/types/schemas";

export type EmployeeInfo = {
  id: string;
  name: string;
  role: string; // Deprecated: kept for backward compatibility during transition
  has_approval: string;
  company_id?: string | number;
  supervisor_id?: string | null;
  department_id?: string | number;
  email?: string;
  phone_number?: string;
  designation?: string;
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  employeeInfo: EmployeeInfo | null;
  isApproved: boolean;
  permissions: UserPermissions;
  permissionsLoading: boolean;
  getAuthorizedNavItems: () => typeof navItems;
  hasPermission: (module: string, action: string) => boolean;
  canRead: (module: string) => boolean;
  canWrite: (module: string) => boolean;
  canDelete: (module: string) => boolean;
  canApprove: (module: string) => boolean;
  canComment: (module: string) => boolean;
  refreshPermissions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [employeeInfo, setEmployeeInfo] = useState<EmployeeInfo | null>(null);
  const [employeeDataLoading, setEmployeeDataLoading] = useState(false);
  const [permissions, setPermissions] = useState<UserPermissions>({});
  const [permissionsLoading, setPermissionsLoading] = useState(false);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.getSession();
      
      if (!error && data.session) {
        setSession(data.session);
        setUser(data.session.user);
      }
      
      setIsLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Fetch employee data when user changes
  useEffect(() => {
    async function fetchEmployeeData() {
      setEmployeeDataLoading(true);
      if (!user) {
        setEmployeeInfo(null);
        return;
      }

      try {
        const data = await getEmployeeInfo();
        setEmployeeInfo(data);
      } catch (error) {
        console.error('Failed to fetch employee data:', error);
        setEmployeeInfo(null);
      } finally {
        setEmployeeDataLoading(false);
      }
    }

    fetchEmployeeData();
  }, [user]);

  // Fetch user permissions when user changes
  useEffect(() => {
    async function fetchUserPermissions() {
      if (!user) {
        setPermissions({});
        return;
      }

      setPermissionsLoading(true);
      try {
        // Call the database function to get aggregated permissions
        const { data, error } = await supabase
          .rpc('get_user_permissions', { user_id: user.id });

        if (error) throw error;

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
      } catch (error) {
        console.error('Failed to fetch permissions:', error);
        setPermissions({});
      } finally {
        setPermissionsLoading(false);
      }
    }

    fetchUserPermissions();
  }, [user]);

  // Determine if the user is approved
  const isApproved = employeeInfo?.has_approval === "ACCEPTED";

  // Permission check functions
  const hasPermission = (module: string, action: string): boolean => {
    if (!permissions[module]) return false;
    const actionKey = action as keyof typeof permissions[typeof module];
    return permissions[module][actionKey] === true;
  };

  const canRead = (module: string): boolean => hasPermission(module, 'can_read');
  const canWrite = (module: string): boolean => hasPermission(module, 'can_write');
  const canDelete = (module: string): boolean => hasPermission(module, 'can_delete');
  const canApprove = (module: string): boolean => hasPermission(module, 'can_approve');
  const canComment = (module: string): boolean => hasPermission(module, 'can_comment');

  // Refresh permissions (useful after team membership changes)
  const refreshPermissions = async () => {
    if (!user) return;

    setPermissionsLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_user_permissions', { user_id: user.id });

      if (error) throw error;

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
    } catch (error) {
      console.error('Failed to refresh permissions:', error);
    } finally {
      setPermissionsLoading(false);
    }
  };

  // Function to get navigation items based on user permissions and approval
  const getAuthorizedNavItems = () => {
    if (!employeeInfo || !isApproved) {
      return [];
    }
    
    // Filter nav items based on required permissions
    return navItems.filter(item => {
      // Backward compatibility: check roles if present
      if (item.roles && item.roles.length > 0) {
        return item.roles.includes(employeeInfo.role);
      }
      
      // New permission-based filtering
      if (item.requiredPermissions && item.requiredPermissions.length > 0) {
        return item.requiredPermissions.some(perm => {
          const [module, action] = perm.split(':');
          return hasPermission(module, action);
        });
      }
      
      // If no roles or permissions specified, show to all
      return true;
    });
  };

  const value = {
    user,
    session,
    isLoading: isLoading || employeeDataLoading,
    employeeInfo,
    isApproved,
    permissions,
    permissionsLoading,
    getAuthorizedNavItems,
    hasPermission,
    canRead,
    canWrite,
    canDelete,
    canApprove,
    canComment,
    refreshPermissions,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
