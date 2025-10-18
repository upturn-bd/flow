"use client";

import { useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import { getCompanyId, getEmployeeId } from "@/lib/utils/auth";
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
      const companyId = await getCompanyId();

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
  }, []);

  /**
   * Fetch a single team by ID with members
   */
  const fetchTeamWithMembers = useCallback(async (
    teamId: number
  ): Promise<TeamWithMembers | null> => {
    setLoading(true);
    setError(null);

    try {
      const companyId = await getCompanyId();

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
          *,
          employee:employees!team_members_employee_id_fkey(
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

      if (membersError) throw membersError;

      // Format members with populated fields
      const members: TeamMember[] = (membersData || []).map((m: any) => ({
        id: m.id,
        team_id: m.team_id,
        employee_id: m.employee_id,
        joined_at: m.joined_at,
        added_by: m.added_by,
        employee_name: m.employee ? `${m.employee.first_name} ${m.employee.last_name}` : 'Unknown',
        employee_email: m.employee?.email,
        added_by_name: m.added_by_employee ? `${m.added_by_employee.first_name} ${m.added_by_employee.last_name}` : 'System',
      }));

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
  }, []);

  /**
   * Fetch a team with its permissions
   */
  const fetchTeamWithPermissions = useCallback(async (
    teamId: number
  ): Promise<TeamWithPermissions | null> => {
    setLoading(true);
    setError(null);

    try {
      const companyId = await getCompanyId();

      // Fetch team details
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("*")
        .eq("id", teamId)
        .eq("company_id", companyId)
        .single();

      if (teamError) throw teamError;

      // Fetch team permissions with permission details
      const { data: permissionsData, error: permissionsError } = await supabase
        .from("team_permissions")
        .select(`
          *,
          permission:permissions(
            id,
            module_name,
            display_name,
            category
          )
        `)
        .eq("team_id", teamId);

      if (permissionsError) throw permissionsError;

      // Format permissions with populated fields
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
        module_name: p.permission?.module_name,
        display_name: p.permission?.display_name,
        category: p.permission?.category,
      }));

      return {
        ...teamData,
        permissions,
      };
    } catch (err: any) {
      const errorMessage = err.message || "Failed to fetch team permissions";
      setError(errorMessage);
      console.error("Error fetching team with permissions:", err);
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
      const empId = employeeId || await getEmployeeId();

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
      const companyId = await getCompanyId();
      const createdBy = await getEmployeeId();

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
      const companyId = await getCompanyId();

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
  }, [fetchTeams]);

  /**
   * Delete a team
   */
  const deleteTeam = useCallback(async (
    teamId: number
  ): Promise<{ success: boolean; error?: any }> => {
    setLoading(true);
    setError(null);

    try {
      const companyId = await getCompanyId();

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
      const addedBy = await getEmployeeId();

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
      const addedBy = await getEmployeeId();

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
  }, []);

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
    updateTeamPermission,
    updateTeamPermissions,
  ]);
}
