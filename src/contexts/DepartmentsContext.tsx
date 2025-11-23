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
import type { Department } from "@/lib/types/schemas";
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

interface DepartmentsContextType {
  // Data
  departments: Department[];
  
  // Loading states
  loading: LoadingStates;
  
  // Error states
  error: ErrorStates;
  
  // Initialization state
  initialized: boolean;
  
  // Fetch operations
  fetchDepartments: (forceRefresh?: boolean) => Promise<Department[]>;
  
  // CRUD operations (optimistic)
  createDepartment: (data: Partial<Department>) => Promise<MutationResponse<Department>>;
  updateDepartment: (
    id: string | number,
    data: Partial<Department>
  ) => Promise<MutationResponse<Department>>;
  deleteDepartment: (id: string | number) => Promise<MutationResponse<boolean>>;
  
  // Utility functions
  getDepartmentById: (id: string | number) => Department | undefined;
  clearErrors: () => void;
  refresh: () => Promise<void>;
}

const DepartmentsContext = createContext<DepartmentsContextType | undefined>(
  undefined
);

interface DepartmentsProviderProps {
  children: ReactNode;
  autoFetch?: boolean;
}

export function DepartmentsProvider({
  children,
  autoFetch = true,
}: DepartmentsProviderProps) {
  const { employeeInfo } = useAuth();
  const companyId = employeeInfo?.company_id;

  // State
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<LoadingStates>(createInitialLoadingStates());
  const [error, setError] = useState<ErrorStates>(createInitialErrorStates());
  const [initialized, setInitialized] = useState(false);

  // Auto-fetch on first access when company_id is available
  useEffect(() => {
    if (autoFetch && companyId && !initialized) {
      devLog.action("DepartmentsContext", "Auto-fetching departments");
      fetchDepartments();
    }
  }, [companyId, autoFetch, initialized]);

  // Fetch departments
  const fetchDepartments = useCallback(
    async (forceRefresh = false): Promise<Department[]> => {
      // Return cached data if available and not forcing refresh
      if (!forceRefresh && initialized && departments.length > 0) {
        devLog.action("DepartmentsContext", "Returning cached departments");
        return departments;
      }

      try {
        const validCompanyId = validateCompanyId(companyId);
        
        setLoading((prev) => ({ ...prev, fetching: true }));
        setError((prev) => ({ ...prev, fetchError: null }));

        devLog.action("DepartmentsContext", "Fetching departments", {
          companyId: validCompanyId,
        });

        const { data, error: fetchError } = await supabase
          .from("departments")
          .select("*")
          .eq("company_id", validCompanyId)
          .order("name", { ascending: true });

        if (fetchError) throw fetchError;

        setDepartments(data || []);
        setInitialized(true);

        devLog.state("DepartmentsContext", {
          count: (data || []).length,
        });

        return data || [];
      } catch (err) {
        const errorMessage = extractErrorMessage(err);
        devLog.error("DepartmentsContext", errorMessage);
        setError((prev) => ({ ...prev, fetchError: errorMessage }));
        return [];
      } finally {
        setLoading((prev) => ({ ...prev, fetching: false }));
      }
    },
    [companyId, initialized, departments]
  );

  // Create department with optimistic update
  const createDepartment = useCallback(
    async (data: Partial<Department>): Promise<MutationResponse<Department>> => {
      try {
        const validCompanyId = validateCompanyId(companyId);
        
        setLoading((prev) => ({ ...prev, creating: true }));
        setError((prev) => ({ ...prev, createError: null }));

        const createData = {
          ...data,
          company_id: validCompanyId,
        };

        devLog.action("DepartmentsContext", "Creating department", createData);

        const { data: newDepartment, error: createError } = await supabase
          .from("departments")
          .insert(createData)
          .select()
          .single();

        if (createError) throw createError;

        // Update state only on success
        setDepartments((prev) => [...prev, newDepartment as Department]);

        devLog.action("DepartmentsContext", "Department created successfully", {
          id: newDepartment.id,
        });

        return createSuccessResponse(newDepartment as Department);
      } catch (err) {
        const errorMessage = extractErrorMessage(err);
        devLog.error("DepartmentsContext", errorMessage);
        setError((prev) => ({ ...prev, createError: errorMessage }));
        return createErrorResponse(errorMessage);
      } finally {
        setLoading((prev) => ({ ...prev, creating: false }));
      }
    },
    [companyId]
  );

  // Update department with optimistic update and rollback on failure
  const updateDepartment = useCallback(
    async (
      id: string | number,
      data: Partial<Department>
    ): Promise<MutationResponse<Department>> => {
      // Store previous state for rollback
      const previousDepartments = [...departments];

      try {
        setLoading((prev) => ({ ...prev, updating: true }));
        setError((prev) => ({ ...prev, updateError: null }));

        // Optimistic update
        setDepartments((prev) =>
          prev.map((dept) => (dept.id === id ? { ...dept, ...data } : dept))
        );

        devLog.action("DepartmentsContext", "Updating department", { id, data });

        const { data: updatedDepartment, error: updateError } = await supabase
          .from("departments")
          .update(data)
          .eq("id", id)
          .select()
          .single();

        if (updateError) throw updateError;

        // Update with server response
        setDepartments((prev) =>
          prev.map((dept) => (dept.id === id ? (updatedDepartment as Department) : dept))
        );

        devLog.action("DepartmentsContext", "Department updated successfully", {
          id,
        });

        return createSuccessResponse(updatedDepartment as Department);
      } catch (err) {
        const errorMessage = extractErrorMessage(err);
        devLog.error("DepartmentsContext", errorMessage);
        
        // Rollback on failure
        setDepartments(previousDepartments);
        setError((prev) => ({ ...prev, updateError: errorMessage }));
        
        return createErrorResponse(errorMessage);
      } finally {
        setLoading((prev) => ({ ...prev, updating: false }));
      }
    },
    [departments]
  );

  // Delete department with optimistic update and rollback on failure
  const deleteDepartment = useCallback(
    async (id: string | number): Promise<MutationResponse<boolean>> => {
      // Store previous state for rollback
      const previousDepartments = [...departments];

      try {
        setLoading((prev) => ({ ...prev, deleting: true }));
        setError((prev) => ({ ...prev, deleteError: null }));

        // Optimistic remove
        setDepartments((prev) => prev.filter((dept) => dept.id !== id));

        devLog.action("DepartmentsContext", "Deleting department", { id });

        const { error: deleteError } = await supabase
          .from("departments")
          .delete()
          .eq("id", id);

        if (deleteError) throw deleteError;

        devLog.action("DepartmentsContext", "Department deleted successfully", {
          id,
        });

        return createSuccessResponse(true);
      } catch (err) {
        const errorMessage = extractErrorMessage(err);
        devLog.error("DepartmentsContext", errorMessage);
        
        // Rollback on failure
        setDepartments(previousDepartments);
        setError((prev) => ({ ...prev, deleteError: errorMessage }));
        
        return createErrorResponse(errorMessage);
      } finally {
        setLoading((prev) => ({ ...prev, deleting: false }));
      }
    },
    [departments]
  );

  // Get department by ID
  const getDepartmentById = useCallback(
    (id: string | number): Department | undefined => {
      return departments.find((dept) => dept.id === id);
    },
    [departments]
  );

  // Clear all errors
  const clearErrors = useCallback(() => {
    setError(createInitialErrorStates());
  }, []);

  // Refresh data
  const refresh = useCallback(async () => {
    devLog.action("DepartmentsContext", "Refreshing departments");
    await fetchDepartments(true);
  }, [fetchDepartments]);

  const value = useMemo(
    () => ({
      departments,
      loading,
      error,
      initialized,
      fetchDepartments,
      createDepartment,
      updateDepartment,
      deleteDepartment,
      getDepartmentById,
      clearErrors,
      refresh,
    }),
    [
      departments,
      loading,
      error,
      initialized,
      fetchDepartments,
      createDepartment,
      updateDepartment,
      deleteDepartment,
      getDepartmentById,
      clearErrors,
      refresh,
    ]
  );

  return (
    <DepartmentsContext.Provider value={value}>
      {children}
    </DepartmentsContext.Provider>
  );
}

export function useDepartmentsContext() {
  const context = useContext(DepartmentsContext);
  if (context === undefined) {
    throw new Error(
      "useDepartmentsContext must be used within a DepartmentsProvider"
    );
  }
  return context;
}
