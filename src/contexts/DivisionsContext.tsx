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
import type { Division } from "@/lib/types/schemas";
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

interface DivisionsContextType {
  // Data
  divisions: Division[];
  
  // Loading states
  loading: LoadingStates;
  
  // Error states
  error: ErrorStates;
  
  // Initialization state
  initialized: boolean;
  
  // Fetch operations
  fetchDivisions: (forceRefresh?: boolean) => Promise<Division[]>;
  
  // CRUD operations (optimistic)
  createDivision: (data: Partial<Division>) => Promise<MutationResponse<Division>>;
  updateDivision: (
    id: string | number,
    data: Partial<Division>
  ) => Promise<MutationResponse<Division>>;
  deleteDivision: (id: string | number) => Promise<MutationResponse<boolean>>;
  
  // Utility functions
  getDivisionById: (id: string | number) => Division | undefined;
  clearErrors: () => void;
  refresh: () => Promise<void>;
}

const DivisionsContext = createContext<DivisionsContextType | undefined>(
  undefined
);

interface DivisionsProviderProps {
  children: ReactNode;
  autoFetch?: boolean;
}

export function DivisionsProvider({
  children,
  autoFetch = true,
}: DivisionsProviderProps) {
  const { employeeInfo } = useAuth();
  const companyId = employeeInfo?.company_id;

  // State
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState<LoadingStates>(createInitialLoadingStates());
  const [error, setError] = useState<ErrorStates>(createInitialErrorStates());
  const [initialized, setInitialized] = useState(false);

  // Auto-fetch on first access when company_id is available
  useEffect(() => {
    if (autoFetch && companyId && !initialized) {
      devLog.action("DivisionsContext", "Auto-fetching divisions");
      fetchDivisions();
    }
  }, [companyId, autoFetch, initialized]);

  // Fetch divisions
  const fetchDivisions = useCallback(
    async (forceRefresh = false): Promise<Division[]> => {
      // Return cached data if available and not forcing refresh
      if (!forceRefresh && initialized && divisions.length > 0) {
        devLog.action("DivisionsContext", "Returning cached divisions");
        return divisions;
      }

      try {
        const validCompanyId = validateCompanyId(companyId);
        
        setLoading((prev) => ({ ...prev, fetching: true }));
        setError((prev) => ({ ...prev, fetchError: null }));

        devLog.action("DivisionsContext", "Fetching divisions", {
          companyId: validCompanyId,
        });

        const { data, error: fetchError } = await supabase
          .from("divisions")
          .select("*")
          .eq("company_id", validCompanyId)
          .order("name", { ascending: true });

        if (fetchError) throw fetchError;

        setDivisions(data || []);
        setInitialized(true);

        devLog.state("DivisionsContext", {
          count: (data || []).length,
        });

        return data || [];
      } catch (err) {
        const errorMessage = extractErrorMessage(err);
        devLog.error("DivisionsContext", errorMessage);
        setError((prev) => ({ ...prev, fetchError: errorMessage }));
        return [];
      } finally {
        setLoading((prev) => ({ ...prev, fetching: false }));
      }
    },
    [companyId, initialized, divisions]
  );

  // Create division with optimistic update
  const createDivision = useCallback(
    async (data: Partial<Division>): Promise<MutationResponse<Division>> => {
      try {
        const validCompanyId = validateCompanyId(companyId);
        
        setLoading((prev) => ({ ...prev, creating: true }));
        setError((prev) => ({ ...prev, createError: null }));

        const createData = {
          ...data,
          company_id: validCompanyId,
        };

        devLog.action("DivisionsContext", "Creating division", createData);

        const { data: newDivision, error: createError } = await supabase
          .from("divisions")
          .insert(createData)
          .select()
          .single();

        if (createError) throw createError;

        // Update state only on success
        setDivisions((prev) => optimisticAdd(prev, newDivision as Division));

        devLog.action("DivisionsContext", "Division created successfully", {
          id: newDivision.id,
        });

        return createSuccessResponse(newDivision as Division);
      } catch (err) {
        const errorMessage = extractErrorMessage(err);
        devLog.error("DivisionsContext", errorMessage);
        setError((prev) => ({ ...prev, createError: errorMessage }));
        return createErrorResponse(errorMessage);
      } finally {
        setLoading((prev) => ({ ...prev, creating: false }));
      }
    },
    [companyId]
  );

  // Update division with optimistic update and rollback on failure
  const updateDivision = useCallback(
    async (
      id: string | number,
      data: Partial<Division>
    ): Promise<MutationResponse<Division>> => {
      // Store previous state for rollback
      const previousDivisions = [...divisions];

      try {
        setLoading((prev) => ({ ...prev, updating: true }));
        setError((prev) => ({ ...prev, updateError: null }));

        // Optimistic update
        setDivisions((prev) => optimisticUpdate(prev, id, data));

        devLog.action("DivisionsContext", "Updating division", { id, data });

        const { data: updatedDivision, error: updateError } = await supabase
          .from("divisions")
          .update(data)
          .eq("id", id)
          .select()
          .single();

        if (updateError) throw updateError;

        // Update with server response
        setDivisions((prev) =>
          prev.map((div) => (div.id === id ? (updatedDivision as Division) : div))
        );

        devLog.action("DivisionsContext", "Division updated successfully", {
          id,
        });

        return createSuccessResponse(updatedDivision as Division);
      } catch (err) {
        const errorMessage = extractErrorMessage(err);
        devLog.error("DivisionsContext", errorMessage);
        
        // Rollback on failure
        setDivisions(previousDivisions);
        setError((prev) => ({ ...prev, updateError: errorMessage }));
        
        return createErrorResponse(errorMessage);
      } finally {
        setLoading((prev) => ({ ...prev, updating: false }));
      }
    },
    [divisions]
  );

  // Delete division with optimistic update and rollback on failure
  const deleteDivision = useCallback(
    async (id: string | number): Promise<MutationResponse<boolean>> => {
      // Store previous state for rollback
      const previousDivisions = [...divisions];

      try {
        setLoading((prev) => ({ ...prev, deleting: true }));
        setError((prev) => ({ ...prev, deleteError: null }));

        // Optimistic remove
        setDivisions((prev) => optimisticRemove(prev, id));

        devLog.action("DivisionsContext", "Deleting division", { id });

        const { error: deleteError } = await supabase
          .from("divisions")
          .delete()
          .eq("id", id);

        if (deleteError) throw deleteError;

        devLog.action("DivisionsContext", "Division deleted successfully", {
          id,
        });

        return createSuccessResponse(true);
      } catch (err) {
        const errorMessage = extractErrorMessage(err);
        devLog.error("DivisionsContext", errorMessage);
        
        // Rollback on failure
        setDivisions(previousDivisions);
        setError((prev) => ({ ...prev, deleteError: errorMessage }));
        
        return createErrorResponse(errorMessage);
      } finally {
        setLoading((prev) => ({ ...prev, deleting: false }));
      }
    },
    [divisions]
  );

  // Get division by ID
  const getDivisionById = useCallback(
    (id: string | number): Division | undefined => {
      return divisions.find((div) => div.id === id);
    },
    [divisions]
  );

  // Clear all errors
  const clearErrors = useCallback(() => {
    setError(createInitialErrorStates());
  }, []);

  // Refresh data
  const refresh = useCallback(async () => {
    devLog.action("DivisionsContext", "Refreshing divisions");
    await fetchDivisions(true);
  }, [fetchDivisions]);

  const value = useMemo(
    () => ({
      divisions,
      loading,
      error,
      initialized,
      fetchDivisions,
      createDivision,
      updateDivision,
      deleteDivision,
      getDivisionById,
      clearErrors,
      refresh,
    }),
    [
      divisions,
      loading,
      error,
      initialized,
      fetchDivisions,
      createDivision,
      updateDivision,
      deleteDivision,
      getDivisionById,
      clearErrors,
      refresh,
    ]
  );

  return (
    <DivisionsContext.Provider value={value}>
      {children}
    </DivisionsContext.Provider>
  );
}

export function useDivisionsContext() {
  const context = useContext(DivisionsContext);
  if (context === undefined) {
    throw new Error(
      "useDivisionsContext must be used within a DivisionsProvider"
    );
  }
  return context;
}
