"use client";

import { useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import { getEmployeeInfo, getCompanyId } from "@/lib/utils/auth";
import { uploadStakeholderStepFile } from "@/lib/utils/files";
import {
  Stakeholder,
  StakeholderProcess,
  StakeholderProcessStep,
  StakeholderStepData,
  ContactPerson,
  FieldDefinitionsSchema,
} from "@/lib/types/schemas";
import { 
  createStakeholderNotification, 
  createAccountNotification 
} from "@/lib/utils/notifications";
import { captureError } from "@/lib/sentry";

// ==============================================================================
// Form Data Interfaces
// ==============================================================================

export interface StakeholderProcessFormData {
  name: string;
  description?: string;
  is_active: boolean;
  is_sequential: boolean;
  allow_rollback: boolean;
}

export interface StakeholderProcessStepFormData {
  process_id: number;
  name: string;
  description?: string;
  step_order: number;
  team_ids: number[]; // Array of team IDs for multi-team assignment
  field_definitions: FieldDefinitionsSchema;
  use_date_range: boolean;
  start_date?: string;
  end_date?: string;
  can_reject?: boolean;
}

export interface StakeholderFormData {
  name: string;
  address?: string;
  contact_persons: ContactPerson[];
  process_id?: number; // Optional - not required for permanent stakeholders
  stakeholder_type_id?: number;
  parent_stakeholder_id?: number;
  is_active: boolean;
  kam_id?: string;
  status?: 'Lead' | 'Permanent' | 'Rejected';
  createAsPermanent?: boolean; // Flag to create directly as permanent
}

export interface StakeholderStepDataFormData {
  stakeholder_id: number;
  step_id: number;
  data: Record<string, any>;
  is_completed?: boolean;
}

export interface StakeholderSearchOptions {
  searchQuery?: string;
  page?: number;
  pageSize?: number;
  filterStatus?: "all" | "Lead" | "Permanent" | "Rejected";
  kamId?: string; // Filter by Key Account Manager
  includeAllCompany?: boolean; // If true, fetches all company stakeholders regardless of KAM
}

export interface StakeholderSearchResult {
  stakeholders: Stakeholder[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

// ==============================================================================
// Main Hook
// ==============================================================================

export function useStakeholders() {
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [processes, setProcesses] = useState<StakeholderProcess[]>([]);
  const [processSteps, setProcessSteps] = useState<StakeholderProcessStep[]>([]);
  const [stepData, setStepData] = useState<StakeholderStepData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // ==========================================================================
  // STAKEHOLDER PROCESSES
  // ==========================================================================

  const fetchProcesses = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const company_id = await getCompanyId();

      const { data, error } = await supabase
        .from("stakeholder_processes")
        .select(`
          *,
          steps:stakeholder_process_steps(count)
        `)
        .eq("company_id", company_id)
        .order("created_at", { ascending: false });

      if (error) {
        setError("Failed to fetch stakeholder processes");
        throw error;
      }

      const transformedData = data?.map((process) => ({
        ...process,
        step_count: process.steps?.[0]?.count || 0,
      })) || [];

      setProcesses(transformedData);
      return transformedData;
    } catch (error) {
      console.error("Error fetching stakeholder processes:", error);
      setError("Failed to fetch stakeholder processes");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProcessById = useCallback(async (processId: number) => {
    setLoading(true);
    setError(null);

    try {
      const company_id = await getCompanyId();

      const { data, error } = await supabase
        .from("stakeholder_processes")
        .select(`
          *,
          steps:stakeholder_process_steps(*)
        `)
        .eq("company_id", company_id)
        .eq("id", processId)
        .single();

      if (error) {
        setError("Failed to fetch process");
        throw error;
      }

      if (data.steps) {
        data.steps.sort((a: any, b: any) => a.step_order - b.step_order);
      }

      return data;
    } catch (error) {
      console.error("Error fetching process:", error);
      setError("Failed to fetch process");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createProcess = useCallback(
    async (processData: StakeholderProcessFormData) => {
      setError(null);
      try {
        const company_id = await getCompanyId();
        const employeeInfo = await getEmployeeInfo();

        const { data, error } = await supabase
          .from("stakeholder_processes")
          .insert([
            {
              ...processData,
              company_id,
              created_by: employeeInfo?.id,
            },
          ])
          .select()
          .single();

        if (error) throw error;

        await fetchProcesses();
        return data;
      } catch (error) {
        console.error("Error creating process:", error);
        setError("Failed to create process");
        throw error;
      }
    },
    [fetchProcesses]
  );

  const updateProcess = useCallback(
    async (processId: number, processData: Partial<StakeholderProcessFormData>) => {
      setError(null);
      setProcessingId(processId);

      try {
        const employeeInfo = await getEmployeeInfo();

        const { data, error } = await supabase
          .from("stakeholder_processes")
          .update({
            ...processData,
            updated_by: employeeInfo?.id,
          })
          .eq("id", processId)
          .select()
          .single();

        if (error) throw error;

        await fetchProcesses();
        return data;
      } catch (error) {
        console.error("Error updating process:", error);
        setError("Failed to update process");
        throw error;
      } finally {
        setProcessingId(null);
      }
    },
    [fetchProcesses]
  );

  const deleteProcess = useCallback(
    async (processId: number) => {
      setError(null);
      setProcessingId(processId);

      try {
        const { error } = await supabase
          .from("stakeholder_processes")
          .delete()
          .eq("id", processId);

        if (error) throw error;

        await fetchProcesses();
        return true;
      } catch (error) {
        console.error("Error deleting process:", error);
        setError("Failed to delete process");
        return false;
      } finally {
        setProcessingId(null);
      }
    },
    [fetchProcesses]
  );

  // ==========================================================================
  // PROCESS STEPS
  // ==========================================================================

  const fetchProcessSteps = useCallback(async (processId: number) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("stakeholder_process_steps")
        .select('*')
        .eq("process_id", processId)
        .order("step_order");

      if (error) {
        setError("Failed to fetch process steps");
        throw error;
      }

      // Collect all unique team IDs from all steps to batch fetch
      const allTeamIds = new Set<number>();
      (data || []).forEach((step) => {
        if (step.team_ids && Array.isArray(step.team_ids)) {
          step.team_ids.forEach((id: number) => allTeamIds.add(id));
        }
      });

      // Fetch all teams in a single query
      let teamsMap = new Map<number, { id: number; name: string }>();
      if (allTeamIds.size > 0) {
        const { data: teams, error: teamsError } = await supabase
          .from("teams")
          .select("id, name")
          .in("id", Array.from(allTeamIds));

        if (!teamsError && teams) {
          teams.forEach((team) => teamsMap.set(team.id, team));
        }
      }

      // Map teams to their respective steps
      const stepsWithTeams = (data || []).map((step) => {
        if (step.team_ids && Array.isArray(step.team_ids) && step.team_ids.length > 0) {
          const teams = step.team_ids
            .map((id: number) => teamsMap.get(id))
            .filter(Boolean);
          return { ...step, teams };
        }
        return step;
      });

      setProcessSteps(stepsWithTeams || []);
      return stepsWithTeams;
    } catch (error) {
      console.error("Error fetching process steps:", error);
      setError("Failed to fetch process steps");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createProcessStep = useCallback(
    async (stepData: StakeholderProcessStepFormData) => {
      setError(null);
      try {
        const employeeInfo = await getEmployeeInfo();

        const { data, error } = await supabase
          .from("stakeholder_process_steps")
          .insert([
            {
              ...stepData,
              created_by: employeeInfo?.id,
            },
          ])
          .select()
          .single();

        if (error) throw error;

        await fetchProcessSteps(stepData.process_id);
        return data;
      } catch (error) {
        console.error("Error creating process step:", error);
        setError("Failed to create process step");
        throw error;
      }
    },
    [fetchProcessSteps]
  );

  const updateProcessStep = useCallback(
    async (stepId: number, stepData: Partial<StakeholderProcessStepFormData>) => {
      setError(null);
      setProcessingId(stepId);

      try {
        const employeeInfo = await getEmployeeInfo();

        const updateData: any = {
          ...stepData,
          updated_by: employeeInfo?.id,
        };

        if (stepData.field_definitions) {
          const { data: currentStep } = await supabase
            .from("stakeholder_process_steps")
            .select("version")
            .eq("id", stepId)
            .single();

          updateData.version = (currentStep?.version || 1) + 1;
        }

        const { error: updateError } = await supabase
          .from("stakeholder_process_steps")
          .update(updateData)
          .eq("id", stepId);

        if (updateError) {
          console.error("Error updating process step:", updateError);
          throw updateError;
        }

        // Fetch the updated step to return it
        const { data: updatedStep, error: fetchError } = await supabase
          .from("stakeholder_process_steps")
          .select("*")
          .eq("id", stepId)
          .single();
        
        if (fetchError || !updatedStep) {
          // Update succeeded but fetch failed - return update data as fallback
          return { id: stepId, ...updateData };
        }

        return updatedStep;
      } catch (error) {
        console.error("Error updating process step:", error);
        setError("Failed to update process step");
        throw error;
      } finally {
        setProcessingId(null);
      }
    },
    []
  );

  const deleteProcessStep = useCallback(
    async (stepId: number, processId: number) => {
      setError(null);
      setProcessingId(stepId);

      try {
        const { error } = await supabase
          .from("stakeholder_process_steps")
          .delete()
          .eq("id", stepId);

        if (error) throw error;

        await fetchProcessSteps(processId);
        return true;
      } catch (error) {
        console.error("Error deleting process step:", error);
        setError("Failed to delete process step");
        return false;
      } finally {
        setProcessingId(null);
      }
    },
    [fetchProcessSteps]
  );

  const reorderProcessSteps = useCallback(
    async (processId: number, stepIds: number[]) => {
      setError(null);

      try {
        const employeeInfo = await getEmployeeInfo();

        // First, set all step_orders to temporary negative values to avoid conflicts
        // This prevents unique constraint violations during the reordering process
        const tempUpdates = stepIds.map((stepId, index) =>
          supabase
            .from("stakeholder_process_steps")
            .update({ 
              step_order: -(index + 1000), // Use negative values as temporary placeholders
              updated_by: employeeInfo?.id,
            })
            .eq("id", stepId)
        );

        await Promise.all(tempUpdates);

        // Then update to the actual final values
        const finalUpdates = stepIds.map((stepId, index) =>
          supabase
            .from("stakeholder_process_steps")
            .update({ 
              step_order: index + 1,
              updated_by: employeeInfo?.id,
            })
            .eq("id", stepId)
        );

        await Promise.all(finalUpdates);

        await fetchProcessSteps(processId);
        return true;
      } catch (error) {
        console.error("Error reordering steps:", error);
        setError("Failed to reorder steps");
        return false;
      }
    },
    [fetchProcessSteps]
  );

  // ==========================================================================
  // STAKEHOLDERS
  // ==========================================================================

  const fetchStakeholders = useCallback(async (includeCompleted = true) => {
    setLoading(true);
    setError(null);

    try {
      const company_id = await getCompanyId();

      let query = supabase
        .from("stakeholders")
        .select(`
          *,
          process:stakeholder_processes(id, name, is_sequential),
          current_step:stakeholder_process_steps(id, name, step_order, status_field),
          stakeholder_type:stakeholder_types(id, name, description),
          parent_stakeholder:stakeholders!parent_stakeholder_id(id, name, status),
          kam:employees!kam_id(id, first_name, last_name, email),
          step_data:stakeholder_step_data(id, stakeholder_id, step_id, data, is_completed)
        `)
        .eq("company_id", company_id);

      if (!includeCompleted) {
        query = query.eq("is_completed", false);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) {
        setError("Failed to fetch stakeholders");
        throw error;
      }

      // Transform kam data to match expected structure
      const transformedData = data?.map((stakeholder) => ({
        ...stakeholder,
        kam: stakeholder.kam ? {
          id: stakeholder.kam.id,
          name: `${stakeholder.kam.first_name} ${stakeholder.kam.last_name}`,
          email: stakeholder.kam.email,
        } : undefined,
      })) || [];

      setStakeholders(transformedData);
      return transformedData;
    } catch (error) {
      console.error("Error fetching stakeholders:", error);
      setError("Failed to fetch stakeholders");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const searchStakeholders = useCallback(async (options: StakeholderSearchOptions = {}) => {
    const { searchQuery = "", page = 1, pageSize = 25, filterStatus = "all", kamId, includeAllCompany = true } = options;
    
    setLoading(true);
    setError(null);
    
    try {
      const company_id = await getCompanyId();
      
      // Build query
      let query = supabase
        .from("stakeholders")
        .select(`
          *,
          process:stakeholder_processes(id, name, is_sequential),
          current_step:stakeholder_process_steps(id, name, step_order, status_field),
          stakeholder_type:stakeholder_types(id, name, description),
          parent_stakeholder:stakeholders!parent_stakeholder_id(id, name, status),
          kam:employees!kam_id(id, first_name, last_name, email),
          step_data:stakeholder_step_data(id, stakeholder_id, step_id, data, is_completed)
        `, { count: 'exact' })
        .eq("company_id", company_id);
      
      // Add KAM filter if provided (only filter by KAM if not including all company)
      if (kamId && !includeAllCompany) {
        query = query.eq("kam_id", kamId);
      }
      
      // Add search filter if provided
      if (searchQuery.trim()) {
        const searchTerm = `%${searchQuery.trim()}%`;
        query = query.or(`name.ilike.${searchTerm},address.ilike.${searchTerm}`);
      }
      
      // Add status filter
      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }
      
      // Add pagination
      const startIndex = (page - 1) * pageSize;
      query = query.range(startIndex, startIndex + pageSize - 1);
      
      // Order by created_at for consistent results
      query = query.order('created_at', { ascending: false });
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      // Transform kam data to match expected structure
      const transformedData = data?.map((stakeholder) => ({
        ...stakeholder,
        kam: stakeholder.kam ? {
          id: stakeholder.kam.id,
          name: `${stakeholder.kam.first_name} ${stakeholder.kam.last_name}`,
          email: stakeholder.kam.email,
        } : undefined,
      })) || [];
      
      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);
      
      const result: StakeholderSearchResult = {
        stakeholders: transformedData,
        totalCount,
        totalPages,
        currentPage: page,
      };
      
      setStakeholders(transformedData);
      return result;
    } catch (error) {
      console.error("Error searching stakeholders:", error);
      setError("Failed to search stakeholders");
      return {
        stakeholders: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: page,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStakeholderById = useCallback(async (stakeholderId: number) => {
    setLoading(true);
    setError(null);

    try {
      const company_id = await getCompanyId();

      const { data, error } = await supabase
        .from("stakeholders")
        .select(`
          *,
          process:stakeholder_processes(
            *,
            steps:stakeholder_process_steps(*)
          ),
          current_step:stakeholder_process_steps(id, name, step_order),
          stakeholder_type:stakeholder_types(id, name, description),
          step_data:stakeholder_step_data(
            *,
            step:stakeholder_process_steps(id, name, step_order)
          ),
          kam:employees!kam_id(id, first_name, last_name, email),
          rejected_by:employees!stakeholders_rejected_by_fkey(id, first_name, last_name, email)
        `)
        .eq("company_id", company_id)
        .eq("id", stakeholderId)
        .single();

      if (error) {
        setError("Failed to fetch stakeholder");
        throw error;
      }

      // Sort steps and fetch teams for each step based on team_ids array
      if (data.process?.steps) {
        data.process.steps.sort((a: any, b: any) => a.step_order - b.step_order);
        
        // Collect all unique team IDs from all steps to batch fetch
        const allTeamIds = new Set<number>();
        data.process.steps.forEach((step: any) => {
          if (step.team_ids && Array.isArray(step.team_ids)) {
            step.team_ids.forEach((id: number) => allTeamIds.add(id));
          }
        });

        // Fetch all teams in a single query
        let teamsMap = new Map<number, { id: number; name: string }>();
        if (allTeamIds.size > 0) {
          const { data: teams, error: teamsError } = await supabase
            .from("teams")
            .select("id, name")
            .in("id", Array.from(allTeamIds));

          if (!teamsError && teams) {
            teams.forEach((team) => teamsMap.set(team.id, team));
          }
        }

        // Map teams to their respective steps
        data.process.steps = data.process.steps.map((step: any) => {
          if (step.team_ids && Array.isArray(step.team_ids) && step.team_ids.length > 0) {
            const teams = step.team_ids
              .map((id: number) => teamsMap.get(id))
              .filter(Boolean);
            return { ...step, teams };
          }
          // If no team_ids but has team relation, use that
          return step;
        });
      }

      if(data.kam) {
        data.kam.name = `${data.kam.first_name} ${data.kam.last_name}`;
      }

      if(data.rejected_by) {
        data.rejected_by.name = `${data.rejected_by.first_name} ${data.rejected_by.last_name}`;
      }

      return data;
    } catch (error) {
      console.error("Error fetching stakeholder:", error);
      setError("Failed to fetch stakeholder");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createStakeholder = useCallback(
    async (stakeholderData: StakeholderFormData) => {
      setError(null);
      try {
        const company_id = await getCompanyId();
        const employeeInfo = await getEmployeeInfo();

        // If creating as permanent, skip process validation
        if (stakeholderData.createAsPermanent) {
          const { data, error } = await supabase
            .from("stakeholders")
            .insert([
              {
                name: stakeholderData.name,
                address: stakeholderData.address,
                contact_persons: stakeholderData.contact_persons,
                stakeholder_type_id: stakeholderData.stakeholder_type_id,
                parent_stakeholder_id: stakeholderData.parent_stakeholder_id,
                kam_id: stakeholderData.kam_id,
                company_id,
                is_active: stakeholderData.is_active,
                is_completed: true, // Permanent stakeholders are marked as completed
                completed_at: new Date().toISOString(),
                status: 'Permanent', // Directly set as Permanent
                current_step_order: 0, // No process steps
                created_by: employeeInfo?.id,
              },
            ])
            .select()
            .single();

          if (error) throw error;

          // Send notification to KAM if assigned
          if (stakeholderData.kam_id) {
            try {
              await createStakeholderNotification(
                stakeholderData.kam_id,
                'created',
                {
                  stakeholderName: stakeholderData.name,
                  processName: 'Permanent (No Process)',
                },
                {
                  referenceId: data.id,
                  actionUrl: `/stakeholders/${data.id}`,
                }
              );
            } catch (notificationError) {
              console.warn('Failed to send KAM notification:', notificationError);
            }
          }

          await fetchStakeholders();
          return data;
        }

        // Original lead creation flow with process
        if (!stakeholderData.process_id) {
          throw new Error("Process ID is required for lead creation");
        }

        const process = await fetchProcessById(stakeholderData.process_id);
        if (!process) {
          throw new Error("Selected process not found");
        }
        if (!process.steps || process.steps.length === 0) {
          throw new Error("Selected process has no steps configured");
        }

        const firstStep = process.steps.sort((a: any, b: any) => a.step_order - b.step_order)[0];

        // Exclude client-side only properties
        const { createAsPermanent, ...dbStakeholderData } = stakeholderData;

        const { data, error } = await supabase
          .from("stakeholders")
          .insert([
            {
              ...dbStakeholderData,
              company_id,
              current_step_id: firstStep.id,
              current_step_order: firstStep.step_order,
              is_completed: false,
              status: 'Lead', // Always start as Lead
              created_by: employeeInfo?.id,
            },
          ])
          .select()
          .single();

        if (error) throw error;

        // Send notifications
        try {
          // Notify KAM if assigned
          if (stakeholderData.kam_id) {
            console.log('[useStakeholders] Sending notification to KAM:', stakeholderData.kam_id);
            try {
              await createStakeholderNotification(
                stakeholderData.kam_id,
                'created',
                {
                  stakeholderName: stakeholderData.name,
                  processName: process.name,
                },
                {
                  referenceId: data.id,
                  actionUrl: `/stakeholders/${data.id}`,
                }
              );
            } catch (kamNotificationError) {
              const errorContext = {
                kamId: stakeholderData.kam_id,
                stakeholderId: data.id,
                stakeholderName: stakeholderData.name,
                operation: 'notifyKAM'
              };
              
              console.error('[useStakeholders] Failed to notify KAM:', {
                ...errorContext,
                error: kamNotificationError,
                errorMessage: kamNotificationError instanceof Error ? kamNotificationError.message : String(kamNotificationError)
              });
              
              captureError(kamNotificationError, errorContext, 'warning');
            }
          }

          // Notify team members of the first step
          if (firstStep.team_ids && firstStep.team_ids.length > 0) {
            // Get all team members from all assigned teams
            const { data: teamMembers } = await supabase
              .from('team_members')
              .select('employee_id, team_id')
              .in('team_id', firstStep.team_ids);

            if (teamMembers && teamMembers.length > 0) {
              // Get unique employee IDs to avoid duplicate notifications
              const uniqueEmployeeIds = [...new Set(teamMembers.map(m => m.employee_id))];
              
              console.log('[useStakeholders] Sending notifications to team members:', uniqueEmployeeIds);
              
              // Send notifications sequentially to better track errors
              for (const employeeId of uniqueEmployeeIds) {
                if (!employeeId) {
                  console.warn('[useStakeholders] Skipping notification for null/undefined employeeId');
                  continue;
                }
                
                try {
                  await createStakeholderNotification(
                    employeeId,
                    'assignedToTeam',
                    {
                      stakeholderName: stakeholderData.name,
                      stepName: firstStep.name,
                      teamName: firstStep.teams?.map((t: any) => t.name).join(', ') || 'Team',
                    },
                    {
                      referenceId: data.id,
                      actionUrl: `/stakeholders/${data.id}`,
                    }
                  );
                } catch (memberNotificationError) {
                  const errorContext = {
                    employeeId,
                    stakeholderId: data.id,
                    stakeholderName: stakeholderData.name,
                    stepName: firstStep.name,
                    operation: 'notifyTeamMember'
                  };
                  
                  console.error('[useStakeholders] Failed to notify team member:', {
                    ...errorContext,
                    error: memberNotificationError,
                    errorMessage: memberNotificationError instanceof Error ? memberNotificationError.message : String(memberNotificationError)
                  });
                  
                  captureError(memberNotificationError, errorContext, 'warning');
                }
              }
            }
          }
        } catch (notificationError) {
          const errorContext = {
            stakeholderId: data.id,
            stakeholderName: stakeholderData.name,
            kamId: stakeholderData.kam_id,
            processId: stakeholderData.stakeholder_process_id,
            operation: 'sendStakeholderCreationNotifications'
          };
          
          console.error('[useStakeholders] Failed to send stakeholder creation notifications:', {
            ...errorContext,
            error: notificationError,
            errorMessage: notificationError instanceof Error ? notificationError.message : String(notificationError)
          });
          
          captureError(notificationError, errorContext, 'error');
        }

        await fetchStakeholders();
        return data;
      } catch (error) {
        console.error("Error creating stakeholder:", error);
        setError("Failed to create stakeholder");
        throw error;
      }
    },
    [fetchStakeholders, fetchProcessById]
  );

  const updateStakeholder = useCallback(
    async (stakeholderId: number, stakeholderData: Partial<StakeholderFormData>) => {
      setError(null);
      setProcessingId(stakeholderId);

      try {
        const employeeInfo = await getEmployeeInfo();

        // Get current stakeholder data to compare changes
        const { data: currentStakeholder, error: fetchError } = await supabase
          .from("stakeholders")
          .select('*, kam:employees!kam_id(id, first_name, last_name)')
          .eq("id", stakeholderId)
          .single();

        if (fetchError) throw fetchError;

        const { data, error } = await supabase
          .from("stakeholders")
          .update({
            ...stakeholderData,
            updated_by: employeeInfo?.id,
          })
          .eq("id", stakeholderId)
          .select()
          .single();

        if (error) throw error;

        // Send notifications only for status changes (not for every minor update)
        try {
          const kamId = stakeholderData.kam_id || currentStakeholder?.kam_id;
          
          // Notify KAM only when status changes
          if (kamId && stakeholderData.status && stakeholderData.status !== currentStakeholder?.status) {
            await createStakeholderNotification(
              kamId,
              'statusChanged',
              {
                stakeholderName: currentStakeholder?.name || data.name,
                oldStatus: currentStakeholder?.status || 'Unknown',
                newStatus: stakeholderData.status,
              },
              {
                referenceId: stakeholderId,
                actionUrl: `/stakeholders/${stakeholderId}`,
              }
            );
          }
        } catch (notificationError) {
          console.warn('Failed to send stakeholder update notifications:', notificationError);
        }

        await fetchStakeholders();
        return data;
      } catch (error) {
        console.error("Error updating stakeholder:", error);
        setError("Failed to update stakeholder");
        throw error;
      } finally {
        setProcessingId(null);
      }
    },
    [fetchStakeholders]
  );

  const deleteStakeholder = useCallback(
    async (stakeholderId: number) => {
      setError(null);
      setProcessingId(stakeholderId);

      try {
        // Optional: Clean up uploaded files before deleting stakeholder
        // This requires listing and deleting files from storage
        try {
          const { data: files } = await supabase.storage
            .from('stakeholder-documents')
            .list(`${stakeholderId}/`);
          
          if (files && files.length > 0) {
            const filePaths = files.map(file => `${stakeholderId}/${file.name}`);
            await supabase.storage
              .from('stakeholder-documents')
              .remove(filePaths);
          }
        } catch (storageError) {
          // Log but don't fail the delete operation if file cleanup fails
          console.warn("Warning: Could not clean up stakeholder files:", storageError);
        }

        const { error } = await supabase
          .from("stakeholders")
          .delete()
          .eq("id", stakeholderId);

        if (error) throw error;

        await fetchStakeholders();
        return true;
      } catch (error) {
        console.error("Error deleting stakeholder:", error);
        setError("Failed to delete stakeholder");
        return false;
      } finally {
        setProcessingId(null);
      }
    },
    [fetchStakeholders]
  );

  // ==========================================================================
  // STEP DATA
  // ==========================================================================

  const fetchStakeholderStepData = useCallback(async (stakeholderId: number) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("stakeholder_step_data")
        .select(`
          *,
          step:stakeholder_process_steps(id, name, step_order)
        `)
        .eq("stakeholder_id", stakeholderId)
        .order("step_id");

      if (error) {
        setError("Failed to fetch step data");
        throw error;
      }

      setStepData(data || []);
      return data;
    } catch (error) {
      console.error("Error fetching step data:", error);
      setError("Failed to fetch step data");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const saveStepData = useCallback(
    async (stepDataForm: StakeholderStepDataFormData) => {
      setError(null);

      try {
        const employeeInfo = await getEmployeeInfo();

        const { data: stepDef, error: stepError } = await supabase
          .from("stakeholder_process_steps")
          .select("field_definitions, version, name, team_ids")
          .eq("id", stepDataForm.step_id)
          .single();

        if (stepError) throw stepError;

        // Get stakeholder data for notifications
        const { data: stakeholderData, error: stakeholderError } = await supabase
          .from("stakeholders")
          .select("id, name, kam_id")
          .eq("id", stepDataForm.stakeholder_id)
          .single();

        if (stakeholderError) throw stakeholderError;

        // Process the data to handle file uploads
        const processedData: Record<string, any> = {};
        const fields = stepDef.field_definitions?.fields || [];
        
        for (const field of fields) {
          const value = stepDataForm.data[field.key];
          
          // Handle file type fields
          if (field.type === "file" && value instanceof File) {
            const uploadResult = await uploadStakeholderStepFile(
              value,
              stepDataForm.stakeholder_id,
              stepDataForm.step_id,
              field.key
            );
            
            if (uploadResult.error) {
              throw new Error(`Failed to upload ${field.label}: ${uploadResult.error}`);
            }
            
            // Store both file path and original filename
            processedData[field.key] = {
              path: uploadResult.uploadedFilePath,
              originalName: value.name,
              size: value.size,
              type: value.type,
              uploadedAt: new Date().toISOString(),
            };
          } else if (field.type === "file" && typeof value === "string") {
            // Legacy: Already uploaded file path (string only)
            processedData[field.key] = value;
          } else if (field.type === "file" && typeof value === "object" && value !== null) {
            // Already uploaded file object with metadata
            processedData[field.key] = value;
          } else {
            // Other field types
            processedData[field.key] = value;
          }
        }
        
        // Include the step status field if it exists in the data
        if (stepDataForm.data["__step_status"] !== undefined) {
          processedData["__step_status"] = stepDataForm.data["__step_status"];
        }

        const dataToSave = {
          stakeholder_id: stepDataForm.stakeholder_id,
          step_id: stepDataForm.step_id,
          data: processedData,
          field_definitions_snapshot: stepDef.field_definitions,
          step_version: stepDef.version || 1,
          is_completed: stepDataForm.is_completed || false,
          completed_at: stepDataForm.is_completed ? new Date().toISOString() : null,
          completed_by: stepDataForm.is_completed ? employeeInfo?.id : null,
          updated_by: employeeInfo?.id,
        };

        const { data, error } = await supabase
          .from("stakeholder_step_data")
          .upsert([dataToSave], {
            onConflict: "stakeholder_id,step_id",
          })
          .select()
          .single();

        if (error) throw error;

        // Send notifications for step data update (only if not completed - completion is handled separately)
        if (!stepDataForm.is_completed) {
          try {
            // Notify KAM about step update
            if (stakeholderData.kam_id) {
              await createStakeholderNotification(
                stakeholderData.kam_id,
                'stepUpdated',
                {
                  stakeholderName: stakeholderData.name,
                  stepName: stepDef.name || 'Step',
                },
                {
                  referenceId: stepDataForm.stakeholder_id,
                  actionUrl: `/stakeholders/${stepDataForm.stakeholder_id}`,
                }
              );
            }

            // Notify team members about step update
            const teamIds = stepDef.team_ids && stepDef.team_ids.length > 0 
              ? stepDef.team_ids 
              : [];

            if (teamIds.length > 0) {
              const { data: teamMembers } = await supabase
                .from('team_members')
                .select('employee_id')
                .in('team_id', teamIds);

              if (teamMembers && teamMembers.length > 0) {
                // Get unique employee IDs to avoid duplicate notifications
                const uniqueEmployeeIds = [...new Set(teamMembers.map(m => m.employee_id))];
                
                await Promise.all(
                  uniqueEmployeeIds.map((employeeId) =>
                    createStakeholderNotification(
                      employeeId,
                      'stepUpdated',
                      {
                        stakeholderName: stakeholderData.name,
                        stepName: stepDef.name || 'Step',
                      },
                      {
                        referenceId: stepDataForm.stakeholder_id,
                        actionUrl: `/stakeholders/${stepDataForm.stakeholder_id}`,
                      }
                    )
                  )
                );
              }
            }
          } catch (notificationError) {
            console.warn('Failed to send step update notifications:', notificationError);
          }
        }

        return data;
      } catch (error) {
        console.error("Error saving step data:", error);
        setError("Failed to save step data");
        throw error;
      }
    },
    []
  );

  const completeStep = useCallback(
    async (stakeholderId: number, stepId: number, data: Record<string, any>) => {
      setError(null);

      try {
        // Get stakeholder data to check process type
        const stakeholderData = await fetchStakeholderById(stakeholderId);
        if (!stakeholderData) {
          throw new Error("Stakeholder not found");
        }

        const isSequential = stakeholderData.process?.is_sequential || false;
        const allSteps = stakeholderData.process?.steps || [];

        // Save the step data as completed
        await saveStepData({
          stakeholder_id: stakeholderId,
          step_id: stepId,
          data,
          is_completed: true,
        });

        // Get the step name for notifications
        const completedStep = allSteps.find((s: StakeholderProcessStep) => s.id === stepId);
        const stepName = completedStep?.name || 'Step';

        // For sequential processes, manually update current_step_id to next step
        let nextStep: StakeholderProcessStep | undefined;
        if (isSequential && allSteps.length > 0) {
          // Find the current step being completed
          const currentStep = allSteps.find((s: StakeholderProcessStep) => s.id === stepId);
          if (currentStep) {
            // Find the next step by step_order
            nextStep = allSteps
              .filter((s: StakeholderProcessStep) => s.step_order > currentStep.step_order)
              .sort((a: StakeholderProcessStep, b: StakeholderProcessStep) => a.step_order - b.step_order)[0];

            if (nextStep && nextStep.id) {
              // Update to next step
              const { error: updateError } = await supabase
                .from("stakeholders")
                .update({
                  current_step_id: nextStep.id,
                  current_step_order: nextStep.step_order,
                })
                .eq("id", stakeholderId);
              
              if (updateError) {
                console.error("Error updating current step:", updateError);
              }
            }
          }
        }

        // Re-fetch to get updated data (use fresh query to avoid cache issues)
        const { data: freshStakeholderData, error: fetchError } = await supabase
          .from("stakeholders")
          .select(`
            *,
            process:stakeholder_processes(
              *,
              steps:stakeholder_process_steps(*)
            ),
            step_data:stakeholder_step_data(id, stakeholder_id, step_id, data, is_completed)
          `)
          .eq("id", stakeholderId)
          .single();

        if (fetchError) {
          console.error("Error fetching updated stakeholder data:", fetchError);
          throw fetchError;
        }
        
        if (freshStakeholderData?.process?.steps) {
          const allStepsCount = freshStakeholderData.process.steps.length;
          const completedSteps = freshStakeholderData.step_data?.filter(
            (sd: StakeholderStepData) => sd.is_completed
          ) || [];
          
          // If all steps are completed, mark stakeholder as completed
          if (allStepsCount > 0 && completedSteps.length >= allStepsCount) {
            const { error: completeError } = await supabase
              .from("stakeholders")
              .update({
                is_completed: true,
                completed_at: new Date().toISOString(),
                status: 'Permanent', // Stakeholder becomes permanent when all steps completed
                current_step_id: null, // Clear current step when fully completed
                current_step_order: null,
              })
              .eq("id", stakeholderId);

            if (completeError) {
              console.error("Error marking stakeholder as completed:", completeError);
              throw completeError;
            }

            // Send completion notification to KAM
            try {
              if (stakeholderData.kam_id) {
                await createStakeholderNotification(
                  stakeholderData.kam_id,
                  'completed',
                  {
                    stakeholderName: stakeholderData.name,
                  },
                  {
                    referenceId: stakeholderId,
                    actionUrl: `/stakeholders/${stakeholderId}`,
                  }
                );
              }
            } catch (notificationError) {
              console.warn('Failed to send stakeholder completion notification:', notificationError);
            }
          }
        }

        // Send notifications for step completion
        try {
          // Notify KAM about step completion
          if (stakeholderData.kam_id) {
            await createStakeholderNotification(
              stakeholderData.kam_id,
              'stepCompleted',
              {
                stakeholderName: stakeholderData.name,
                stepName: stepName,
              },
              {
                referenceId: stakeholderId,
                actionUrl: `/stakeholders/${stakeholderId}`,
              }
            );
          }

          // Notify current step team members about completion
          const currentTeamIds = completedStep?.team_ids && completedStep.team_ids.length > 0
            ? completedStep.team_ids
            : [];

          if (currentTeamIds.length > 0) {
            const { data: teamMembers } = await supabase
              .from('team_members')
              .select('employee_id')
              .in('team_id', currentTeamIds);

            if (teamMembers && teamMembers.length > 0) {
              const uniqueEmployeeIds = [...new Set(teamMembers.map(m => m.employee_id))];
              
              await Promise.all(
                uniqueEmployeeIds.map((employeeId) =>
                  createStakeholderNotification(
                    employeeId,
                    'stepCompleted',
                    {
                      stakeholderName: stakeholderData.name,
                      stepName: stepName,
                    },
                    {
                      referenceId: stakeholderId,
                      actionUrl: `/stakeholders/${stakeholderId}`,
                    }
                  )
                )
              );
            }
          }

          // Notify next step team members if sequential
          const nextTeamIds = nextStep?.team_ids && nextStep.team_ids.length > 0
            ? nextStep.team_ids
            : [];

          if (nextStep && nextTeamIds.length > 0) {
            const { data: nextTeamMembers } = await supabase
              .from('team_members')
              .select('employee_id')
              .in('team_id', nextTeamIds);

            if (nextTeamMembers && nextTeamMembers.length > 0) {
              const uniqueEmployeeIds = [...new Set(nextTeamMembers.map(m => m.employee_id))];
              
              await Promise.all(
                uniqueEmployeeIds.map((employeeId) =>
                  createStakeholderNotification(
                    employeeId,
                    'assignedToTeam',
                    {
                      stakeholderName: stakeholderData.name,
                      stepName: nextStep.name,
                      teamName: nextStep.team?.name || 'Team',
                    },
                    {
                      referenceId: stakeholderId,
                      actionUrl: `/stakeholders/${stakeholderId}`,
                    }
                  )
                )
              );
            }
          }
        } catch (notificationError) {
          console.warn('Failed to send step completion notifications:', notificationError);
        }

        return true;
      } catch (error) {
        console.error("Error completing step:", error);
        setError("Failed to complete step");
        throw error;
      }
    },
    [saveStepData, fetchStakeholderById]
  );

  const uncompleteStep = useCallback(
    async (stakeholderId: number, stepId: number) => {
      setError(null);

      try {
        const employeeInfo = await getEmployeeInfo();

        // Get stakeholder info to check if it's sequential
        const stakeholderData = await fetchStakeholderById(stakeholderId);
        if (!stakeholderData) {
          throw new Error("Stakeholder not found");
        }

        const isSequential = stakeholderData.process?.is_sequential || false;

        // Get the step name for notifications
        const stepBeingRolledBack = stakeholderData.process?.steps?.find((s: StakeholderProcessStep) => s.id === stepId);
        const stepName = stepBeingRolledBack?.name || 'Step';

        // For sequential processes, we need to uncomplete this step AND all steps after it
        if (isSequential && stakeholderData.process?.steps) {
          // Find the step_order of the step being rolled back
          if (!stepBeingRolledBack) {
            throw new Error("Step not found in process");
          }

          // Get all steps that come at or after this step
          const stepsToUncomplete = stakeholderData.process.steps
            .filter((s: StakeholderProcessStep) => s.step_order >= stepBeingRolledBack.step_order)
            .map((s: StakeholderProcessStep) => s.id)
            .filter((id: number | undefined): id is number => id !== undefined);

          // Uncomplete all these steps
          const { error: updateError } = await supabase
            .from("stakeholder_step_data")
            .update({
              is_completed: false,
              completed_at: null,
              completed_by: null,
              updated_by: employeeInfo?.id,
            })
            .eq("stakeholder_id", stakeholderId)
            .in("step_id", stepsToUncomplete);

          if (updateError) throw updateError;

          // Update stakeholder to set current_step_id to the rolled back step
          // Also update current_step_order to match
          const { error: updateStakeholderError } = await supabase
            .from("stakeholders")
            .update({
              current_step_id: stepId,
              current_step_order: stepBeingRolledBack.step_order,
              is_completed: false,
              completed_at: null,
              status: 'Lead',
            })
            .eq("id", stakeholderId);

          if (updateStakeholderError) throw updateStakeholderError;
        } else {
          // For non-sequential processes, just uncomplete the specific step
          const { error: updateError } = await supabase
            .from("stakeholder_step_data")
            .update({
              is_completed: false,
              completed_at: null,
              completed_by: null,
              updated_by: employeeInfo?.id,
            })
            .eq("stakeholder_id", stakeholderId)
            .eq("step_id", stepId);

          if (updateError) throw updateError;

          // Just revert completion status if stakeholder was marked complete
          const { error: revertError } = await supabase
            .from("stakeholders")
            .update({
              is_completed: false,
              completed_at: null,
              status: 'Lead',
            })
            .eq("id", stakeholderId)
            .eq("is_completed", true);

          if (revertError) throw revertError;
        }

        // Send notifications for rollback
        try {
          // Notify KAM about rollback
          if (stakeholderData.kam_id) {
            await createStakeholderNotification(
              stakeholderData.kam_id,
              'stepRolledBack',
              {
                stakeholderName: stakeholderData.name,
                stepName: stepName,
              },
              {
                referenceId: stakeholderId,
                actionUrl: `/stakeholders/${stakeholderId}`,
              }
            );
          }

          // Notify team members of the rolled back step
          const rollbackTeamIds = stepBeingRolledBack?.team_ids && stepBeingRolledBack.team_ids.length > 0
            ? stepBeingRolledBack.team_ids
            : [];

          if (rollbackTeamIds.length > 0) {
            const { data: teamMembers } = await supabase
              .from('team_members')
              .select('employee_id')
              .in('team_id', rollbackTeamIds);

            if (teamMembers && teamMembers.length > 0) {
              const uniqueEmployeeIds = [...new Set(teamMembers.map(m => m.employee_id))];
              
              await Promise.all(
                uniqueEmployeeIds.map((employeeId) =>
                  createStakeholderNotification(
                    employeeId,
                    'stepRolledBack',
                    {
                      stakeholderName: stakeholderData.name,
                      stepName: stepName,
                    },
                    {
                      referenceId: stakeholderId,
                      actionUrl: `/stakeholders/${stakeholderId}`,
                    }
                  )
                )
              );
            }
          }
        } catch (notificationError) {
          console.warn('Failed to send rollback notifications:', notificationError);
        }

        return true;
      } catch (error) {
        console.error("Error uncompleting step:", error);
        setError("Failed to rollback step");
        throw error;
      }
    },
    [fetchStakeholderById]
  );

  // Update additional data for a stakeholder
  const updateAdditionalData = useCallback(
    async (stakeholderId: number, additionalData: Record<string, any>) => {
      setError(null);

      try {
        const employeeInfo = await getEmployeeInfo();

        const { error } = await supabase
          .from("stakeholders")
          .update({
            additional_data: additionalData,
            updated_by: employeeInfo?.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", stakeholderId);

        if (error) throw error;

        return true;
      } catch (error) {
        console.error("Error updating additional data:", error);
        setError("Failed to update additional data");
        return false;
      }
    },
    []
  );

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================

  const activeProcesses = useMemo(
    () => processes.filter((p) => p.is_active),
    [processes]
  );

  const leads = useMemo(
    () => stakeholders.filter((s) => s.status === 'Lead'),
    [stakeholders]
  );

  const permanentStakeholders = useMemo(
    () => stakeholders.filter((s) => s.status === 'Permanent'),
    [stakeholders]
  );

  const rejectedStakeholders = useMemo(
    () => stakeholders.filter((s) => s.status === 'Rejected'),
    [stakeholders]
  );

  // Backward compatibility
  const completedStakeholders = permanentStakeholders;

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    // State
    stakeholders,
    processes,
    processSteps,
    stepData,
    loading,
    error,
    processingId,

    // Computed
    activeProcesses,
    leads,
    permanentStakeholders,
    rejectedStakeholders,
    completedStakeholders, // Backward compatibility

    // Process operations
    fetchProcesses,
    fetchProcessById,
    createProcess,
    updateProcess,
    deleteProcess,

    // Step operations
    fetchProcessSteps,
    createProcessStep,
    updateProcessStep,
    deleteProcessStep,
    reorderProcessSteps,

    // Stakeholder operations
    fetchStakeholders,
    searchStakeholders,
    fetchStakeholderById,
    createStakeholder,
    updateStakeholder,
    deleteStakeholder,

    // Step data operations
    fetchStakeholderStepData,
    saveStepData,
    completeStep,
    uncompleteStep,
    updateAdditionalData,
  };
}
