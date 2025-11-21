"use client";

import { useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import type { 
  Team, 
  TeamMember, 
  TeamPermission, 
  TeamWithMembers, 
  TeamWithPermissions 
} from "@/lib/types/schemas";

/**
 * Custom hook for managing teams and team memberships
 * Follows the same pattern as useEmployees for consistency
 */
export function useTeams() {
  const { employeeInfo } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ==============================================================================
  // Fetch Functions
  // ==============================================================================

  /**
   * Fetch all teams for the current company
   */
  const fetchTeams = useCallback(async (): Promise<Team[]> => {
    setLoading(true);
    setError(null);

    try {
      const companyId = employeeInfo?.company_id;
      if (!companyId) {
        setLoading(false);
        return [];
      }

      const { data, error: fetchError } = await supabase
        .from("teams")
        .select("*")
        .eq("company_id", companyId)
        .order("name", { ascending: true });

      if (fetchError) throw fetchError;

      setTeams(data || []);
      return data || [];
    } catch (err: any) {
      const errorMessage = err.message || "Failed to fetch teams";
      setError(errorMessage);
      console.error("Error fetching teams:", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [employeeInfo?.company_id]);

  /**
   * Fetch a single team by ID with members
   */
  const fetchTeamWithMembers = useCallback(async (
    teamId: number
  ): Promise<TeamWithMembers | null> => {
    setLoading(true);
    setError(null);

    try {
      const companyId = employeeInfo?.company_id;
      if (!companyId) {
        throw new Error('Company ID not available');
      }

      // Fetch team details
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("*")
        .eq("id", teamId)
        .eq("company_id", companyId)
        .single();

      if (teamError) throw teamError;

      // Fetch team members with employee details
      const { data: membersData, error: membersError } = await supabase
        .from("team_members")
        .select(`
          id,
          team_id,
          employee_id,
          joined_at,
          added_by,
          employees!team_members_employee_id_fkey(
            id,
            first_name,
            last_name,
            email
          ),
          added_by_employee:employees!team_members_added_by_fkey(
            first_name,
            last_name
          )
        `)
        .eq("team_id", teamId);

      if (membersError) {
        console.error("Error fetching team members:", membersError);
        throw membersError;
      }

      // Format members with populated fields
      const members: TeamMember[] = (membersData || []).map((m: any) => {
        const employee = m.employees;
        return {
          id: m.id,
          team_id: m.team_id,
          employee_id: m.employee_id,
          joined_at: m.joined_at,
          added_by: m.added_by,
          employee_name: employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown',
          employee_email: employee?.email,
          added_by_name: m.added_by_employee ? `${m.added_by_employee.first_name} ${m.added_by_employee.last_name}` : 'System',
        };
      });

      return {
        ...teamData,
        member_count: members.length,
        members,
      };
    } catch (err: any) {
      const errorMessage = err.message || "Failed to fetch team details";
      setError(errorMessage);
      console.error("Error fetching team with members:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [employeeInfo?.company_id]);

  /**
   * Fetch a team with its permissions
   */
  const fetchTeamWithPermissions = useCallback(async (
    teamId: number
  ): Promise<TeamWithPermissions | null> => {
    setLoading(true);
    setError(null);

    try {
      const companyId = employeeInfo?.company_id;
      if (!companyId) {
        setLoading(false);
        return null;
      }

      // Fetch team details
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("*")
        .eq("id", teamId)
        .eq("company_id", companyId)
        .single();

      if (teamError) {
        console.error("Error fetching team:", teamError);
        throw teamError;
      }

      // Fetch team permissions with permission details
      // Note: If team has no permissions yet, this will return empty array (not an error)
      const { data: permissionsData, error: permissionsError } = await supabase
        .from("team_permissions")
        .select(`
          id,
          team_id,
          permission_id,
          can_read,
          can_write,
          can_delete,
          can_approve,
          can_comment,
          created_at,
          updated_at,
          permissions!team_permissions_permission_id_fkey(
            id,
            module_name,
            display_name,
            category
          )
        `)
        .eq("team_id", teamId);

      // Only throw error if it's a real database error, not just empty results
      if (permissionsError) {
        console.error("Error fetching team permissions:", permissionsError);
        console.error("Error code:", permissionsError.code);
        console.error("Error details:", permissionsError.details);
        console.error("Error hint:", permissionsError.hint);
        throw permissionsError;
      }

      // Format permissions with populated fields
      // If no permissions exist yet, return empty array
      const permissions: TeamPermission[] = (permissionsData || []).map((p: any) => ({
        id: p.id,
        team_id: p.team_id,
        permission_id: p.permission_id,
        can_read: p.can_read,
        can_write: p.can_write,
        can_delete: p.can_delete,
        can_approve: p.can_approve,
        can_comment: p.can_comment,
        created_at: p.created_at,
        updated_at: p.updated_at,
        module_name: p.permissions?.module_name,
        display_name: p.permissions?.display_name,
        category: p.permissions?.category,
      }));

      return {
        ...teamData,
        permissions,
      };
    } catch (err: any) {
      const errorMessage = err.message || err.hint || "Failed to fetch team permissions";
      setError(errorMessage);
      console.error("Error fetching team with permissions:", err);
      console.error("Error details:", JSON.stringify(err, null, 2));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch teams for a specific employee
   */
  const fetchEmployeeTeams = useCallback(async (
    employeeId?: string
  ): Promise<Team[]> => {
    setLoading(true);
    setError(null);

    try {
      const empId = employeeId ?? employeeInfo?.id;
      if (!empId) {
        throw new Error('Employee ID not available');
      }

      const { data, error: fetchError } = await supabase
        .from("team_members")
        .select(`
          team:teams(*)
        `)
        .eq("employee_id", empId);

      if (fetchError) throw fetchError;

      const employeeTeams = (data || []).map((item: any) => item.team).filter(Boolean);
      return employeeTeams;
    } catch (err: any) {
      const errorMessage = err.message || "Failed to fetch employee teams";
      setError(errorMessage);
      console.error("Error fetching employee teams:", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ==============================================================================
  // CRUD Operations
  // ==============================================================================

  /**
   * Create a new team
   */
  const createTeam = useCallback(async (
    teamData: Omit<Team, 'id' | 'created_at' | 'updated_at'>
  ): Promise<{ success: boolean; data?: Team; error?: any }> => {
    setLoading(true);
    setError(null);

    try {
      const companyId = employeeInfo?.company_id;
      const createdBy = employeeInfo?.id;
      if (!companyId || !createdBy) {
        throw new Error('Company ID or User ID not available');
      }

      const { data, error: createError } = await supabase
        .from("teams")
        .insert({
          ...teamData,
          company_id: companyId,
          created_by: createdBy,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Refresh teams list
      await fetchTeams();

      return { success: true, data };
    } catch (err: any) {
      const errorMessage = err.message || "Failed to create team";
      setError(errorMessage);
      console.error("Error creating team:", err);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, [fetchTeams]);

  /**
   * Update an existing team
   */
  const updateTeam = useCallback(async (
    teamId: number,
    updates: Partial<Team>
  ): Promise<{ success: boolean; data?: Team; error?: any }> => {
    setLoading(true);
    setError(null);

    try {
      const companyId = employeeInfo?.company_id;
      if (!companyId) {
        throw new Error('Company ID not available');
      }

      const { data, error: updateError } = await supabase
        .from("teams")
        .update(updates)
        .eq("id", teamId)
        .eq("company_id", companyId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Refresh teams list
      await fetchTeams();

      return { success: true, data };
    } catch (err: any) {
      const errorMessage = err.message || "Failed to update team";
      setError(errorMessage);
      console.error("Error updating team:", err);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, [fetchTeams, employeeInfo?.company_id]);

  /**
   * Delete a team
   */
  const deleteTeam = useCallback(async (
    teamId: number
  ): Promise<{ success: boolean; error?: any }> => {
    setLoading(true);
    setError(null);

    try {
      const companyId = employeeInfo?.company_id;
      if (!companyId) {
        throw new Error('Company ID not available');
      }

      const { error: deleteError } = await supabase
        .from("teams")
        .delete()
        .eq("id", teamId)
        .eq("company_id", companyId);

      if (deleteError) throw deleteError;

      // Refresh teams list
      await fetchTeams();

      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || "Failed to delete team";
      setError(errorMessage);
      console.error("Error deleting team:", err);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, [fetchTeams]);

  // ==============================================================================
  // Team Member Management
  // ==============================================================================

  /**
   * Add a member to a team
   */
  const addTeamMember = useCallback(async (
    teamId: number,
    employeeId: string
  ): Promise<{ success: boolean; data?: TeamMember; error?: any }> => {
    setLoading(true);
    setError(null);

    try {
      const addedBy = employeeInfo?.id;
      if (!addedBy) {
        throw new Error('User ID not available');
      }

      const { data, error: addError } = await supabase
        .from("team_members")
        .insert({
          team_id: teamId,
          employee_id: employeeId,
          added_by: addedBy,
        })
        .select()
        .single();

      if (addError) throw addError;

      return { success: true, data };
    } catch (err: any) {
      const errorMessage = err.message || "Failed to add team member";
      setError(errorMessage);
      console.error("Error adding team member:", err);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Remove a member from a team
   */
  const removeTeamMember = useCallback(async (
    teamId: number,
    employeeId: string
  ): Promise<{ success: boolean; error?: any }> => {
    setLoading(true);
    setError(null);

    try {
      const { error: removeError } = await supabase
        .from("team_members")
        .delete()
        .eq("team_id", teamId)
        .eq("employee_id", employeeId);

      if (removeError) throw removeError;

      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || "Failed to remove team member";
      setError(errorMessage);
      console.error("Error removing team member:", err);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Bulk add members to a team
   */
  const addTeamMembers = useCallback(async (
    teamId: number,
    employeeIds: string[]
  ): Promise<{ success: boolean; error?: any }> => {
    setLoading(true);
    setError(null);

    try {
      const addedBy = employeeInfo?.id;
      if (!addedBy) {
        throw new Error('User ID not available');
      }

      const members = employeeIds.map(employeeId => ({
        team_id: teamId,
        employee_id: employeeId,
        added_by: addedBy,
      }));

      const { error: addError } = await supabase
        .from("team_members")
        .insert(members);

      if (addError) throw addError;

      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || "Failed to add team members";
      setError(errorMessage);
      console.error("Error adding team members:", err);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, [employeeInfo?.id]);

  // ==============================================================================
  // Team Permission Management
  // ==============================================================================

  /**
   * Update team permissions for a specific module
   */
  const updateTeamPermission = useCallback(async (
    teamId: number,
    permissionId: number,
    permissions: Partial<Omit<TeamPermission, 'id' | 'team_id' | 'permission_id'>>
  ): Promise<{ success: boolean; error?: any }> => {
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from("team_permissions")
        .upsert({
          team_id: teamId,
          permission_id: permissionId,
          ...permissions,
        }, {
          onConflict: 'team_id,permission_id'
        });

      if (updateError) throw updateError;

      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || "Failed to update team permission";
      setError(errorMessage);
      console.error("Error updating team permission:", err);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Bulk update team permissions
   */
  const updateTeamPermissions = useCallback(async (
    teamId: number,
    permissions: Array<{
      permission_id: number;
      can_read?: boolean;
      can_write?: boolean;
      can_delete?: boolean;
      can_approve?: boolean;
      can_comment?: boolean;
    }>
  ): Promise<{ success: boolean; error?: any }> => {
    setLoading(true);
    setError(null);

    try {
      const permissionsData = permissions.map(p => ({
        team_id: teamId,
        ...p,
      }));

      const { error: updateError } = await supabase
        .from("team_permissions")
        .upsert(permissionsData, {
          onConflict: 'team_id,permission_id'
        });

      if (updateError) throw updateError;

      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || "Failed to update team permissions";
      setError(errorMessage);
      console.error("Error updating team permissions:", err);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==============================================================================
  // Utility Functions
  // ==============================================================================

  /**
   * Check if an employee is a member of a specific team
   */
  const isTeamMember = useCallback(async (
    teamId: number,
    employeeId?: string
  ): Promise<boolean> => {
    try {
      const empId = employeeId ?? employeeInfo?.id;
      if (!empId) {
        throw new Error('Employee ID not available');
      }

      const { data, error: fetchError } = await supabase
        .from("team_members")
        .select("id")
        .eq("team_id", teamId)
        .eq("employee_id", empId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // Ignore "not found" errors
        console.error("Error checking team membership:", fetchError);
        return false;
      }

      return !!data;
    } catch (err: any) {
      console.error("Error checking team membership:", err);
      return false;
    }
  }, [employeeInfo?.id]);

  /**
   * Get all team IDs for a specific employee
   */
  const getEmployeeTeamIds = useCallback(async (
    employeeId?: string
  ): Promise<number[]> => {
    try {
      const empId = employeeId ?? employeeInfo?.id;
      if (!empId) {
        // Silently return empty array if employee info not yet loaded
        return [];
      }

      const { data, error: fetchError } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("employee_id", empId);

      if (fetchError) throw fetchError;

      return (data || []).map((item: any) => item.team_id);
    } catch (err: any) {
      console.error("Error fetching employee team IDs:", err);
      return [];
    }
  }, [employeeInfo?.id]);

  // ==============================================================================
  // Return hook interface
  // ==============================================================================

  return useMemo(() => ({
    // State
    teams,
    loading,
    error,

    // Fetch functions
    fetchTeams,
    fetchTeamWithMembers,
    fetchTeamWithPermissions,
    fetchEmployeeTeams,

    // CRUD operations
    createTeam,
    updateTeam,
    deleteTeam,

    // Team member management
    addTeamMember,
    removeTeamMember,
    addTeamMembers,

    // Utility functions
    isTeamMember,
    getEmployeeTeamIds,

    // Permission management
    updateTeamPermission,
    updateTeamPermissions,
  }), [
    teams,
    loading,
    error,
    fetchTeams,
    fetchTeamWithMembers,
    fetchTeamWithPermissions,
    fetchEmployeeTeams,
    createTeam,
    updateTeam,
    deleteTeam,
    addTeamMember,
    removeTeamMember,
    addTeamMembers,
    isTeamMember,
    getEmployeeTeamIds,
    updateTeamPermission,
    updateTeamPermissions,
  ]);
}
