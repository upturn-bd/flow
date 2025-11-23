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
import type { Position } from "@/lib/types/schemas";
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

interface PositionsContextType {
  // Data
  positions: Position[];
  
  // Loading states
  loading: LoadingStates;
  
  // Error states
  error: ErrorStates;
  
  // Initialization state
  initialized: boolean;
  
  // Fetch operations
  fetchPositions: (forceRefresh?: boolean) => Promise<Position[]>;
  
  // CRUD operations (optimistic)
  createPosition: (data: Partial<Position>) => Promise<MutationResponse<Position>>;
  updatePosition: (
    id: string | number,
    data: Partial<Position>
  ) => Promise<MutationResponse<Position>>;
  deletePosition: (id: string | number) => Promise<MutationResponse<boolean>>;
  
  // Utility functions
  getPositionById: (id: string | number) => Position | undefined;
  clearErrors: () => void;
  refresh: () => Promise<void>;
}

const PositionsContext = createContext<PositionsContextType | undefined>(
  undefined
);

interface PositionsProviderProps {
  children: ReactNode;
  autoFetch?: boolean;
}

export function PositionsProvider({
  children,
  autoFetch = true,
}: PositionsProviderProps) {
  const { employeeInfo } = useAuth();
  const companyId = employeeInfo?.company_id;

  // State
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState<LoadingStates>(createInitialLoadingStates());
  const [error, setError] = useState<ErrorStates>(createInitialErrorStates());
  const [initialized, setInitialized] = useState(false);

  // Auto-fetch on first access when company_id is available
  useEffect(() => {
    if (autoFetch && companyId && !initialized) {
      devLog.action("PositionsContext", "Auto-fetching positions");
      fetchPositions();
    }
  }, [companyId, autoFetch, initialized]);

  // Fetch positions
  const fetchPositions = useCallback(
    async (forceRefresh = false): Promise<Position[]> => {
      // Return cached data if available and not forcing refresh
      if (!forceRefresh && initialized && positions.length > 0) {
        devLog.action("PositionsContext", "Returning cached positions");
        return positions;
      }

      try {
        const validCompanyId = validateCompanyId(companyId);
        
        setLoading((prev) => ({ ...prev, fetching: true }));
        setError((prev) => ({ ...prev, fetchError: null }));

        devLog.action("PositionsContext", "Fetching positions", {
          companyId: validCompanyId,
        });

        const { data, error: fetchError } = await supabase
          .from("positions")
          .select("*")
          .eq("company_id", validCompanyId)
          .order("name", { ascending: true });

        if (fetchError) throw fetchError;

        setPositions(data || []);
        setInitialized(true);

        devLog.state("PositionsContext", {
          count: (data || []).length,
        });

        return data || [];
      } catch (err) {
        const errorMessage = extractErrorMessage(err);
        devLog.error("PositionsContext", errorMessage);
        setError((prev) => ({ ...prev, fetchError: errorMessage }));
        return [];
      } finally {
        setLoading((prev) => ({ ...prev, fetching: false }));
      }
    },
    [companyId, initialized, positions]
  );

  // Create position with optimistic update
  const createPosition = useCallback(
    async (data: Partial<Position>): Promise<MutationResponse<Position>> => {
      try {
        const validCompanyId = validateCompanyId(companyId);
        
        setLoading((prev) => ({ ...prev, creating: true }));
        setError((prev) => ({ ...prev, createError: null }));

        const createData = {
          ...data,
          company_id: validCompanyId,
        };

        devLog.action("PositionsContext", "Creating position", createData);

        const { data: newPosition, error: createError } = await supabase
          .from("positions")
          .insert(createData)
          .select()
          .single();

        if (createError) throw createError;

        // Update state only on success
        setPositions((prev) => [...prev, newPosition as Position]);

        devLog.action("PositionsContext", "Position created successfully", {
          id: newPosition.id,
        });

        return createSuccessResponse(newPosition as Position);
      } catch (err) {
        const errorMessage = extractErrorMessage(err);
        devLog.error("PositionsContext", errorMessage);
        setError((prev) => ({ ...prev, createError: errorMessage }));
        return createErrorResponse(errorMessage);
      } finally {
        setLoading((prev) => ({ ...prev, creating: false }));
      }
    },
    [companyId]
  );

  // Update position with optimistic update and rollback on failure
  const updatePosition = useCallback(
    async (
      id: string | number,
      data: Partial<Position>
    ): Promise<MutationResponse<Position>> => {
      // Store previous state for rollback
      const previousPositions = [...positions];

      try {
        setLoading((prev) => ({ ...prev, updating: true }));
        setError((prev) => ({ ...prev, updateError: null }));

        // Optimistic update
        setPositions((prev) => prev.map((pos) => (pos.id === id ? { ...pos, ...data } : pos)));

        devLog.action("PositionsContext", "Updating position", { id, data });

        const { data: updatedPosition, error: updateError } = await supabase
          .from("positions")
          .update(data)
          .eq("id", id)
          .select()
          .single();

        if (updateError) throw updateError;

        // Update with server response
        setPositions((prev) =>
          prev.map((pos) => (pos.id === id ? (updatedPosition as Position) : pos))
        );

        devLog.action("PositionsContext", "Position updated successfully", {
          id,
        });

        return createSuccessResponse(updatedPosition as Position);
      } catch (err) {
        const errorMessage = extractErrorMessage(err);
        devLog.error("PositionsContext", errorMessage);
        
        // Rollback on failure
        setPositions(previousPositions);
        setError((prev) => ({ ...prev, updateError: errorMessage }));
        
        return createErrorResponse(errorMessage);
      } finally {
        setLoading((prev) => ({ ...prev, updating: false }));
      }
    },
    [positions]
  );

  // Delete position with optimistic update and rollback on failure
  const deletePosition = useCallback(
    async (id: string | number): Promise<MutationResponse<boolean>> => {
      // Store previous state for rollback
      const previousPositions = [...positions];

      try {
        setLoading((prev) => ({ ...prev, deleting: true }));
        setError((prev) => ({ ...prev, deleteError: null }));

        // Optimistic remove
        setPositions((prev) => prev.filter((pos) => pos.id !== id));

        devLog.action("PositionsContext", "Deleting position", { id });

        const { error: deleteError } = await supabase
          .from("positions")
          .delete()
          .eq("id", id);

        if (deleteError) throw deleteError;

        devLog.action("PositionsContext", "Position deleted successfully", {
          id,
        });

        return createSuccessResponse(true);
      } catch (err) {
        const errorMessage = extractErrorMessage(err);
        devLog.error("PositionsContext", errorMessage);
        
        // Rollback on failure
        setPositions(previousPositions);
        setError((prev) => ({ ...prev, deleteError: errorMessage }));
        
        return createErrorResponse(errorMessage);
      } finally {
        setLoading((prev) => ({ ...prev, deleting: false }));
      }
    },
    [positions]
  );

  // Get position by ID
  const getPositionById = useCallback(
    (id: string | number): Position | undefined => {
      return positions.find((pos) => pos.id === id);
    },
    [positions]
  );

  // Clear all errors
  const clearErrors = useCallback(() => {
    setError(createInitialErrorStates());
  }, []);

  // Refresh data
  const refresh = useCallback(async () => {
    devLog.action("PositionsContext", "Refreshing positions");
    await fetchPositions(true);
  }, [fetchPositions]);

  const value = useMemo(
    () => ({
      positions,
      loading,
      error,
      initialized,
      fetchPositions,
      createPosition,
      updatePosition,
      deletePosition,
      getPositionById,
      clearErrors,
      refresh,
    }),
    [
      positions,
      loading,
      error,
      initialized,
      fetchPositions,
      createPosition,
      updatePosition,
      deletePosition,
      getPositionById,
      clearErrors,
      refresh,
    ]
  );

  return (
    <PositionsContext.Provider value={value}>
      {children}
    </PositionsContext.Provider>
  );
}

export function usePositionsContext() {
  const context = useContext(PositionsContext);
  if (context === undefined) {
    throw new Error(
      "usePositionsContext must be used within a PositionsProvider"
    );
  }
  return context;
}
