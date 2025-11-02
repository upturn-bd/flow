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
  team_id: number;
  field_definitions: FieldDefinitionsSchema;
  use_date_range: boolean;
  start_date?: string;
  end_date?: string;
}

export interface StakeholderFormData {
  name: string;
  address?: string;
  contact_persons: ContactPerson[];
  process_id: number;
  is_active: boolean;
  issue_handler_id?: string;
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
  filterStatus?: "all" | "leads" | "completed";
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
          steps:stakeholder_process_steps(
            *,
            team:teams(id, name)
          )
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
        .select(`
          *,
          team:teams(id, name)
        `)
        .eq("process_id", processId)
        .order("step_order");

      if (error) {
        setError("Failed to fetch process steps");
        throw error;
      }

      setProcessSteps(data || []);
      return data;
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

        const { data, error } = await supabase
          .from("stakeholder_process_steps")
          .update(updateData)
          .eq("id", stepId)
          .select()
          .single();

        if (error) throw error;

        return data;
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

        const updates = stepIds.map((stepId, index) =>
          supabase
            .from("stakeholder_process_steps")
            .update({ 
              step_order: index + 1,
              updated_by: employeeInfo?.id,
            })
            .eq("id", stepId)
        );

        await Promise.all(updates);

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
          current_step:stakeholder_process_steps(id, name, step_order)
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

      setStakeholders(data || []);
      return data;
    } catch (error) {
      console.error("Error fetching stakeholders:", error);
      setError("Failed to fetch stakeholders");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const searchStakeholders = useCallback(async (options: StakeholderSearchOptions = {}) => {
    const { searchQuery = "", page = 1, pageSize = 25, filterStatus = "all" } = options;
    
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
          current_step:stakeholder_process_steps(id, name, step_order)
        `, { count: 'exact' })
        .eq("company_id", company_id);
      
      // Add search filter if provided
      if (searchQuery.trim()) {
        const searchTerm = `%${searchQuery.trim()}%`;
        query = query.or(`name.ilike.${searchTerm},address.ilike.${searchTerm}`);
      }
      
      // Add status filter
      if (filterStatus === "leads") {
        query = query.eq("is_completed", false);
      } else if (filterStatus === "completed") {
        query = query.eq("is_completed", true);
      }
      
      // Add pagination
      const startIndex = (page - 1) * pageSize;
      query = query.range(startIndex, startIndex + pageSize - 1);
      
      // Order by created_at for consistent results
      query = query.order('created_at', { ascending: false });
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);
      
      const result: StakeholderSearchResult = {
        stakeholders: data || [],
        totalCount,
        totalPages,
        currentPage: page,
      };
      
      setStakeholders(data || []);
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
            steps:stakeholder_process_steps(
              *,
              team:teams(id, name)
            )
          ),
          current_step:stakeholder_process_steps(id, name, step_order),
          step_data:stakeholder_step_data(
            *,
            step:stakeholder_process_steps(id, name, step_order)
          )
        `)
        .eq("company_id", company_id)
        .eq("id", stakeholderId)
        .single();

      if (error) {
        setError("Failed to fetch stakeholder");
        throw error;
      }

      if (data.process?.steps) {
        data.process.steps.sort((a: any, b: any) => a.step_order - b.step_order);
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

        const process = await fetchProcessById(stakeholderData.process_id);
        if (!process) {
          throw new Error("Selected process not found");
        }
        if (!process.steps || process.steps.length === 0) {
          throw new Error("Selected process has no steps configured");
        }

        const firstStep = process.steps.sort((a: any, b: any) => a.step_order - b.step_order)[0];

        const { data, error } = await supabase
          .from("stakeholders")
          .insert([
            {
              ...stakeholderData,
              company_id,
              current_step_id: firstStep.id,
              current_step_order: firstStep.step_order,
              is_completed: false,
              created_by: employeeInfo?.id,
            },
          ])
          .select()
          .single();

        if (error) throw error;

        await fetchStakeholders();
        return data;
      } catch (error) {
        console.error("Error creating stakeholder:", error);
        setError("Failed to create stakeholder");
        throw error;
      }
    },
    [fetchStakeholders]
  );

  const updateStakeholder = useCallback(
    async (stakeholderId: number, stakeholderData: Partial<StakeholderFormData>) => {
      setError(null);
      setProcessingId(stakeholderId);

      try {
        const employeeInfo = await getEmployeeInfo();

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
          .select("field_definitions, version")
          .eq("id", stepDataForm.step_id)
          .single();

        if (stepError) throw stepError;

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

        const dataToSave = {
          stakeholder_id: stepDataForm.stakeholder_id,
          step_id: stepDataForm.step_id,
          data: processedData,
          field_definitions_snapshot: stepDef.field_definitions,
          step_version: stepDef.version,
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
        // Save the step data as completed
        await saveStepData({
          stakeholder_id: stakeholderId,
          step_id: stepId,
          data,
          is_completed: true,
        });

        // Fetch the stakeholder to check if the process is sequential
        const stakeholderData = await fetchStakeholderById(stakeholderId);
        
        if (stakeholderData?.process?.is_sequential) {
          // Get the current step's order
          const currentStep = stakeholderData.process.steps?.find(
            (step: StakeholderProcessStep) => step.id === stepId
          );

          if (currentStep) {
            // Find the next step
            const nextStep = stakeholderData.process.steps
              ?.sort((a: StakeholderProcessStep, b: StakeholderProcessStep) => 
                a.step_order - b.step_order
              )
              .find((step: StakeholderProcessStep) => 
                step.step_order === currentStep.step_order + 1
              );

            if (nextStep) {
              // Update the stakeholder's current step
              await supabase
                .from("stakeholders")
                .update({
                  current_step_id: nextStep.id,
                  current_step_order: nextStep.step_order,
                })
                .eq("id", stakeholderId);
            } else {
              // No more steps - mark stakeholder as completed
              await supabase
                .from("stakeholders")
                .update({
                  is_completed: true,
                  completed_at: new Date().toISOString(),
                })
                .eq("id", stakeholderId);
            }
          }
        }

        // Refresh stakeholder data
        await fetchStakeholderById(stakeholderId);

        return true;
      } catch (error) {
        console.error("Error completing step:", error);
        return false;
      }
    },
    [saveStepData, fetchStakeholderById]
  );

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================

  const activeProcesses = useMemo(
    () => processes.filter((p) => p.is_active),
    [processes]
  );

  const leads = useMemo(
    () => stakeholders.filter((s) => !s.is_completed),
    [stakeholders]
  );

  const completedStakeholders = useMemo(
    () => stakeholders.filter((s) => s.is_completed),
    [stakeholders]
  );

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
    completedStakeholders,

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
  };
}
