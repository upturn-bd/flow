"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
  useMemo,
} from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import type { 
  Team, 
  TeamMember, 
  TeamPermission,
} from "@/lib/types/schemas";
import {
  LoadingStates,
  ErrorStates,
  MutationResponse,
} from "./types";
import {
  devLog,
  createInitialLoadingStates,
  createInitialErrorStates,
  createSuccessResponse,
  createErrorResponse,
  extractErrorMessage,
  validateCompanyId,
  optimisticAdd,
  optimisticUpdate,
  optimisticRemove,
} from "./utils";

interface TeamsContextType {
  // Data
  teams: Team[];
  
  // Loading states
  loading: LoadingStates;
  
  // Error states
  error: ErrorStates;
  
  // Initialization state
  initialized: boolean;
  
  // Fetch operations
  fetchTeams: (forceRefresh?: boolean) => Promise<Team[]>;
  
  // CRUD operations (optimistic)
  createTeam: (data: Partial<Team>) => Promise<MutationResponse<Team>>;
  updateTeam: (
    id: string | number,
    data: Partial<Team>
  ) => Promise<MutationResponse<Team>>;
  deleteTeam: (id: string | number) => Promise<MutationResponse<boolean>>;
  
  // Team member operations
  addTeamMember: (teamId: number, employeeId: string) => Promise<MutationResponse<TeamMember>>;
  removeTeamMember: (teamId: number, employeeId: string) => Promise<MutationResponse<boolean>>;
  getEmployeeTeamIds: (employeeId: string) => Promise<number[]>;
  
  // Utility functions
  getTeamById: (id: string | number) => Team | undefined;
  clearErrors: () => void;
  refresh: () => Promise<void>;
}

const TeamsContext = createContext<TeamsContextType | undefined>(
  undefined
);

interface TeamsProviderProps {
  children: ReactNode;
  autoFetch?: boolean;
}

export function TeamsProvider({
  children,
  autoFetch = true,
}: TeamsProviderProps) {
  const { employeeInfo } = useAuth();
  const companyId = employeeInfo?.company_id;

  // State
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState<LoadingStates>(createInitialLoadingStates());
  const [error, setError] = useState<ErrorStates>(createInitialErrorStates());
  const [initialized, setInitialized] = useState(false);

  // Auto-fetch on first access when company_id is available
  useEffect(() => {
    if (autoFetch && companyId && !initialized) {
      devLog.action("TeamsContext", "Auto-fetching teams");
      fetchTeams();
    }
  }, [companyId, autoFetch, initialized]);

  // Fetch teams
  const fetchTeams = useCallback(
    async (forceRefresh = false): Promise<Team[]> => {
      // Return cached data if available and not forcing refresh
      if (!forceRefresh && initialized && teams.length > 0) {
        devLog.action("TeamsContext", "Returning cached teams");
        return teams;
      }

      try {
        const validCompanyId = validateCompanyId(companyId);
        
        setLoading((prev) => ({ ...prev, fetching: true }));
        setError((prev) => ({ ...prev, fetchError: null }));

        devLog.action("TeamsContext", "Fetching teams", {
          companyId: validCompanyId,
        });

        const { data, error: fetchError } = await supabase
          .from("teams")
          .select("*")
          .eq("company_id", validCompanyId)
          .order("name", { ascending: true });

        if (fetchError) throw fetchError;

        setTeams(data || []);
        setInitialized(true);

        devLog.state("TeamsContext", {
          count: (data || []).length,
        });

        return data || [];
      } catch (err) {
        const errorMessage = extractErrorMessage(err);
        devLog.error("TeamsContext", errorMessage);
        setError((prev) => ({ ...prev, fetchError: errorMessage }));
        return [];
      } finally {
        setLoading((prev) => ({ ...prev, fetching: false }));
      }
    },
    [companyId, initialized, teams]
  );

  // Create team with optimistic update
  const createTeam = useCallback(
    async (data: Partial<Team>): Promise<MutationResponse<Team>> => {
      try {
        const validCompanyId = validateCompanyId(companyId);
        
        setLoading((prev) => ({ ...prev, creating: true }));
        setError((prev) => ({ ...prev, createError: null }));

        const createData = {
          ...data,
          company_id: validCompanyId,
        };

        devLog.action("TeamsContext", "Creating team", createData);

        const { data: newTeam, error: createError } = await supabase
          .from("teams")
          .insert(createData)
          .select()
          .single();

        if (createError) throw createError;

        // Update state only on success
        setTeams((prev) => optimisticAdd(prev, newTeam as Team));

        devLog.action("TeamsContext", "Team created successfully", {
          id: newTeam.id,
        });

        return createSuccessResponse(newTeam as Team);
      } catch (err) {
        const errorMessage = extractErrorMessage(err);
        devLog.error("TeamsContext", errorMessage);
        setError((prev) => ({ ...prev, createError: errorMessage }));
        return createErrorResponse(errorMessage);
      } finally {
        setLoading((prev) => ({ ...prev, creating: false }));
      }
    },
    [companyId]
  );

  // Update team with optimistic update and rollback on failure
  const updateTeam = useCallback(
    async (
      id: string | number,
      data: Partial<Team>
    ): Promise<MutationResponse<Team>> => {
      // Store previous state for rollback
      const previousTeams = [...teams];

      try {
        setLoading((prev) => ({ ...prev, updating: true }));
        setError((prev) => ({ ...prev, updateError: null }));

        // Optimistic update
        setTeams((prev) => optimisticUpdate(prev, id, data));

        devLog.action("TeamsContext", "Updating team", { id, data });

        const { data: updatedTeam, error: updateError } = await supabase
          .from("teams")
          .update(data)
          .eq("id", id)
          .select()
          .single();

        if (updateError) throw updateError;

        // Update with server response
        setTeams((prev) =>
          prev.map((team) => (team.id === id ? (updatedTeam as Team) : team))
        );

        devLog.action("TeamsContext", "Team updated successfully", {
          id,
        });

        return createSuccessResponse(updatedTeam as Team);
      } catch (err) {
        const errorMessage = extractErrorMessage(err);
        devLog.error("TeamsContext", errorMessage);
        
        // Rollback on failure
        setTeams(previousTeams);
        setError((prev) => ({ ...prev, updateError: errorMessage }));
        
        return createErrorResponse(errorMessage);
      } finally {
        setLoading((prev) => ({ ...prev, updating: false }));
      }
    },
    [teams]
  );

  // Delete team with optimistic update and rollback on failure
  const deleteTeam = useCallback(
    async (id: string | number): Promise<MutationResponse<boolean>> => {
      // Store previous state for rollback
      const previousTeams = [...teams];

      try {
        setLoading((prev) => ({ ...prev, deleting: true }));
        setError((prev) => ({ ...prev, deleteError: null }));

        // Optimistic remove
        setTeams((prev) => optimisticRemove(prev, id));

        devLog.action("TeamsContext", "Deleting team", { id });

        const { error: deleteError } = await supabase
          .from("teams")
          .delete()
          .eq("id", id);

        if (deleteError) throw deleteError;

        devLog.action("TeamsContext", "Team deleted successfully", {
          id,
        });

        return createSuccessResponse(true);
      } catch (err) {
        const errorMessage = extractErrorMessage(err);
        devLog.error("TeamsContext", errorMessage);
        
        // Rollback on failure
        setTeams(previousTeams);
        setError((prev) => ({ ...prev, deleteError: errorMessage }));
        
        return createErrorResponse(errorMessage);
      } finally {
        setLoading((prev) => ({ ...prev, deleting: false }));
      }
    },
    [teams]
  );

  // Add team member
  const addTeamMember = useCallback(
    async (teamId: number, employeeId: string): Promise<MutationResponse<TeamMember>> => {
      try {
        setLoading((prev) => ({ ...prev, creating: true }));
        setError((prev) => ({ ...prev, createError: null }));

        devLog.action("TeamsContext", "Adding team member", { teamId, employeeId });

        const { data: newMember, error: createError } = await supabase
          .from("team_members")
          .insert({ team_id: teamId, employee_id: employeeId })
          .select()
          .single();

        if (createError) throw createError;

        devLog.action("TeamsContext", "Team member added successfully");

        return createSuccessResponse(newMember as TeamMember);
      } catch (err) {
        const errorMessage = extractErrorMessage(err);
        devLog.error("TeamsContext", errorMessage);
        setError((prev) => ({ ...prev, createError: errorMessage }));
        return createErrorResponse(errorMessage);
      } finally {
        setLoading((prev) => ({ ...prev, creating: false }));
      }
    },
    []
  );

  // Remove team member
  const removeTeamMember = useCallback(
    async (teamId: number, employeeId: string): Promise<MutationResponse<boolean>> => {
      try {
        setLoading((prev) => ({ ...prev, deleting: true }));
        setError((prev) => ({ ...prev, deleteError: null }));

        devLog.action("TeamsContext", "Removing team member", { teamId, employeeId });

        const { error: deleteError } = await supabase
          .from("team_members")
          .delete()
          .eq("team_id", teamId)
          .eq("employee_id", employeeId);

        if (deleteError) throw deleteError;

        devLog.action("TeamsContext", "Team member removed successfully");

        return createSuccessResponse(true);
      } catch (err) {
        const errorMessage = extractErrorMessage(err);
        devLog.error("TeamsContext", errorMessage);
        setError((prev) => ({ ...prev, deleteError: errorMessage }));
        return createErrorResponse(errorMessage);
      } finally {
        setLoading((prev) => ({ ...prev, deleting: false }));
      }
    },
    []
  );

  // Get employee team IDs
  const getEmployeeTeamIds = useCallback(
    async (employeeId: string): Promise<number[]> => {
      try {
        devLog.action("TeamsContext", "Getting employee team IDs", { employeeId });

        const { data, error: fetchError } = await supabase
          .from("team_members")
          .select("team_id")
          .eq("employee_id", employeeId);

        if (fetchError) throw fetchError;

        const teamIds = (data || []).map((member) => member.team_id);

        devLog.state("TeamsContext", { teamIds });

        return teamIds;
      } catch (err) {
        const errorMessage = extractErrorMessage(err);
        devLog.error("TeamsContext", errorMessage);
        return [];
      }
    },
    []
  );

  // Get team by ID
  const getTeamById = useCallback(
    (id: string | number): Team | undefined => {
      return teams.find((team) => team.id === id);
    },
    [teams]
  );

  // Clear all errors
  const clearErrors = useCallback(() => {
    setError(createInitialErrorStates());
  }, []);

  // Refresh data
  const refresh = useCallback(async () => {
    devLog.action("TeamsContext", "Refreshing teams");
    await fetchTeams(true);
  }, [fetchTeams]);

  const value = useMemo(
    () => ({
      teams,
      loading,
      error,
      initialized,
      fetchTeams,
      createTeam,
      updateTeam,
      deleteTeam,
      addTeamMember,
      removeTeamMember,
      getEmployeeTeamIds,
      getTeamById,
      clearErrors,
      refresh,
    }),
    [
      teams,
      loading,
      error,
      initialized,
      fetchTeams,
      createTeam,
      updateTeam,
      deleteTeam,
      addTeamMember,
      removeTeamMember,
      getEmployeeTeamIds,
      getTeamById,
      clearErrors,
      refresh,
    ]
  );

  return (
    <TeamsContext.Provider value={value}>
      {children}
    </TeamsContext.Provider>
  );
}

export function useTeamsContext() {
  const context = useContext(TeamsContext);
  if (context === undefined) {
    throw new Error(
      "useTeamsContext must be used within a TeamsProvider"
    );
  }
  return context;
}
