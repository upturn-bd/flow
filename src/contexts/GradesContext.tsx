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
import type { Grade } from "@/lib/types/schemas";
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

interface GradesContextType {
  // Data
  grades: Grade[];
  
  // Loading states
  loading: LoadingStates;
  
  // Error states
  error: ErrorStates;
  
  // Initialization state
  initialized: boolean;
  
  // Fetch operations
  fetchGrades: (forceRefresh?: boolean) => Promise<Grade[]>;
  
  // CRUD operations (optimistic)
  createGrade: (data: Partial<Grade>) => Promise<MutationResponse<Grade>>;
  updateGrade: (
    id: string | number,
    data: Partial<Grade>
  ) => Promise<MutationResponse<Grade>>;
  deleteGrade: (id: string | number) => Promise<MutationResponse<boolean>>;
  
  // Utility functions
  getGradeById: (id: string | number) => Grade | undefined;
  clearErrors: () => void;
  refresh: () => Promise<void>;
}

const GradesContext = createContext<GradesContextType | undefined>(
  undefined
);

interface GradesProviderProps {
  children: ReactNode;
  autoFetch?: boolean;
}

export function GradesProvider({
  children,
  autoFetch = true,
}: GradesProviderProps) {
  const { employeeInfo } = useAuth();
  const companyId = employeeInfo?.company_id;

  // State
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState<LoadingStates>(createInitialLoadingStates());
  const [error, setError] = useState<ErrorStates>(createInitialErrorStates());
  const [initialized, setInitialized] = useState(false);

  // Auto-fetch on first access when company_id is available
  useEffect(() => {
    if (autoFetch && companyId && !initialized) {
      devLog.action("GradesContext", "Auto-fetching grades");
      fetchGrades();
    }
  }, [companyId, autoFetch, initialized]);

  // Fetch grades
  const fetchGrades = useCallback(
    async (forceRefresh = false): Promise<Grade[]> => {
      // Return cached data if available and not forcing refresh
      if (!forceRefresh && initialized && grades.length > 0) {
        devLog.action("GradesContext", "Returning cached grades");
        return grades;
      }

      try {
        const validCompanyId = validateCompanyId(companyId);
        
        setLoading((prev) => ({ ...prev, fetching: true }));
        setError((prev) => ({ ...prev, fetchError: null }));

        devLog.action("GradesContext", "Fetching grades", {
          companyId: validCompanyId,
        });

        const { data, error: fetchError } = await supabase
          .from("grades")
          .select("*")
          .eq("company_id", validCompanyId)
          .order("name", { ascending: true });

        if (fetchError) throw fetchError;

        setGrades(data || []);
        setInitialized(true);

        devLog.state("GradesContext", {
          count: (data || []).length,
        });

        return data || [];
      } catch (err) {
        const errorMessage = extractErrorMessage(err);
        devLog.error("GradesContext", errorMessage);
        setError((prev) => ({ ...prev, fetchError: errorMessage }));
        return [];
      } finally {
        setLoading((prev) => ({ ...prev, fetching: false }));
      }
    },
    [companyId, initialized, grades]
  );

  // Create grade with optimistic update
  const createGrade = useCallback(
    async (data: Partial<Grade>): Promise<MutationResponse<Grade>> => {
      try {
        const validCompanyId = validateCompanyId(companyId);
        
        setLoading((prev) => ({ ...prev, creating: true }));
        setError((prev) => ({ ...prev, createError: null }));

        const createData = {
          ...data,
          company_id: validCompanyId,
        };

        devLog.action("GradesContext", "Creating grade", createData);

        const { data: newGrade, error: createError } = await supabase
          .from("grades")
          .insert(createData)
          .select()
          .single();

        if (createError) throw createError;

        // Update state only on success
        setGrades((prev) => optimisticAdd(prev, newGrade as Grade));

        devLog.action("GradesContext", "Grade created successfully", {
          id: newGrade.id,
        });

        return createSuccessResponse(newGrade as Grade);
      } catch (err) {
        const errorMessage = extractErrorMessage(err);
        devLog.error("GradesContext", errorMessage);
        setError((prev) => ({ ...prev, createError: errorMessage }));
        return createErrorResponse(errorMessage);
      } finally {
        setLoading((prev) => ({ ...prev, creating: false }));
      }
    },
    [companyId]
  );

  // Update grade with optimistic update and rollback on failure
  const updateGrade = useCallback(
    async (
      id: string | number,
      data: Partial<Grade>
    ): Promise<MutationResponse<Grade>> => {
      // Store previous state for rollback
      const previousGrades = [...grades];

      try {
        setLoading((prev) => ({ ...prev, updating: true }));
        setError((prev) => ({ ...prev, updateError: null }));

        // Optimistic update
        setGrades((prev) => optimisticUpdate(prev, id, data));

        devLog.action("GradesContext", "Updating grade", { id, data });

        const { data: updatedGrade, error: updateError } = await supabase
          .from("grades")
          .update(data)
          .eq("id", id)
          .select()
          .single();

        if (updateError) throw updateError;

        // Update with server response
        setGrades((prev) =>
          prev.map((grade) => (grade.id === id ? (updatedGrade as Grade) : grade))
        );

        devLog.action("GradesContext", "Grade updated successfully", {
          id,
        });

        return createSuccessResponse(updatedGrade as Grade);
      } catch (err) {
        const errorMessage = extractErrorMessage(err);
        devLog.error("GradesContext", errorMessage);
        
        // Rollback on failure
        setGrades(previousGrades);
        setError((prev) => ({ ...prev, updateError: errorMessage }));
        
        return createErrorResponse(errorMessage);
      } finally {
        setLoading((prev) => ({ ...prev, updating: false }));
      }
    },
    [grades]
  );

  // Delete grade with optimistic update and rollback on failure
  const deleteGrade = useCallback(
    async (id: string | number): Promise<MutationResponse<boolean>> => {
      // Store previous state for rollback
      const previousGrades = [...grades];

      try {
        setLoading((prev) => ({ ...prev, deleting: true }));
        setError((prev) => ({ ...prev, deleteError: null }));

        // Optimistic remove
        setGrades((prev) => optimisticRemove(prev, id));

        devLog.action("GradesContext", "Deleting grade", { id });

        const { error: deleteError } = await supabase
          .from("grades")
          .delete()
          .eq("id", id);

        if (deleteError) throw deleteError;

        devLog.action("GradesContext", "Grade deleted successfully", {
          id,
        });

        return createSuccessResponse(true);
      } catch (err) {
        const errorMessage = extractErrorMessage(err);
        devLog.error("GradesContext", errorMessage);
        
        // Rollback on failure
        setGrades(previousGrades);
        setError((prev) => ({ ...prev, deleteError: errorMessage }));
        
        return createErrorResponse(errorMessage);
      } finally {
        setLoading((prev) => ({ ...prev, deleting: false }));
      }
    },
    [grades]
  );

  // Get grade by ID
  const getGradeById = useCallback(
    (id: string | number): Grade | undefined => {
      return grades.find((grade) => grade.id === id);
    },
    [grades]
  );

  // Clear all errors
  const clearErrors = useCallback(() => {
    setError(createInitialErrorStates());
  }, []);

  // Refresh data
  const refresh = useCallback(async () => {
    devLog.action("GradesContext", "Refreshing grades");
    await fetchGrades(true);
  }, [fetchGrades]);

  const value = useMemo(
    () => ({
      grades,
      loading,
      error,
      initialized,
      fetchGrades,
      createGrade,
      updateGrade,
      deleteGrade,
      getGradeById,
      clearErrors,
      refresh,
    }),
    [
      grades,
      loading,
      error,
      initialized,
      fetchGrades,
      createGrade,
      updateGrade,
      deleteGrade,
      getGradeById,
      clearErrors,
      refresh,
    ]
  );

  return (
    <GradesContext.Provider value={value}>
      {children}
    </GradesContext.Provider>
  );
}

export function useGradesContext() {
  const context = useContext(GradesContext);
  if (context === undefined) {
    throw new Error(
      "useGradesContext must be used within a GradesProvider"
    );
  }
  return context;
}
