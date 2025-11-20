"use client";

import { useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { StakeholderType } from "@/lib/types/schemas";

// ==============================================================================
// Form Data Interface
// ==============================================================================

export interface StakeholderTypeFormData {
  name: string;
  description?: string;
  is_active: boolean;
}

// ==============================================================================
// Main Hook
// ==============================================================================

export function useStakeholderTypes() {
  const { employeeInfo } = useAuth();
  const [stakeholderTypes, setStakeholderTypes] = useState<StakeholderType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // ==========================================================================
  // FETCH OPERATIONS
  // ==========================================================================

  const fetchStakeholderTypes = useCallback(async (includeInactive = false) => {
    setLoading(true);
    setError(null);

    try {
      const companyId = employeeInfo?.company_id;
      if (!companyId) {
        setLoading(false);
        return [];
      }

      let query = supabase
        .from("stakeholder_types")
        .select("*")
        .eq("company_id", companyId);

      if (!includeInactive) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query.order("name");

      if (error) {
        console.error('[useStakeholderTypes] Query error:', error);
        setError("Failed to fetch stakeholder types");
        throw error;
      }

      setStakeholderTypes(data || []);
      return data;
    } catch (error) {
      console.error("[useStakeholderTypes] Error fetching stakeholder types:", error);
      setError("Failed to fetch stakeholder types");
      return [];
    } finally {
      setLoading(false);
    }
  }, [employeeInfo?.company_id]);

  const fetchStakeholderTypeById = useCallback(async (typeId: number) => {
    setLoading(true);
    setError(null);

    try {
      const companyId = employeeInfo?.company_id;
      if (!companyId) {
        setLoading(false);
        return null;
      }

      const { data, error } = await supabase
        .from("stakeholder_types")
        .select("*")
        .eq("company_id", companyId)
        .eq("id", typeId)
        .single();

      if (error) {
        setError("Failed to fetch stakeholder type");
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error fetching stakeholder type:", error);
      setError("Failed to fetch stakeholder type");
      return null;
    } finally {
      setLoading(false);
    }
  }, [employeeInfo?.company_id]);

  // ==========================================================================
  // CREATE OPERATION
  // ==========================================================================

  const createStakeholderType = useCallback(
    async (typeData: StakeholderTypeFormData) => {
      setError(null);
      try {
        const companyId = employeeInfo?.company_id;
        const userId = employeeInfo?.id;
        if (!companyId || !userId) {
          throw new Error('Company ID or User ID not available');
        }

        const { data, error } = await supabase
          .from("stakeholder_types")
          .insert([
            {
              ...typeData,
              company_id: companyId,
              created_by: userId,
            },
          ])
          .select()
          .single();

        if (error) throw error;

        return data;
      } catch (error) {
        console.error("Error creating stakeholder type:", error);
        setError("Failed to create stakeholder type");
        throw error;
      }
    },
    [employeeInfo?.company_id, employeeInfo?.id]
  );

  // ==========================================================================
  // UPDATE OPERATION
  // ==========================================================================

  const updateStakeholderType = useCallback(
    async (typeId: number, typeData: Partial<StakeholderTypeFormData>) => {
      if (!employeeInfo) {
        console.warn('Cannot update stakeholder type: Employee info not available');
        return null;
      }

      setError(null);
      setProcessingId(typeId);

      try {
        const { data, error } = await supabase
          .from("stakeholder_types")
          .update({
            ...typeData,
            updated_by: employeeInfo.id,
          })
          .eq("id", typeId)
          .select()
          .single();

        if (error) throw error;

        return data;
      } catch (error) {
        console.error("Error updating stakeholder type:", error);
        setError("Failed to update stakeholder type");
        throw error;
      } finally {
        setProcessingId(null);
      }
    },
    [employeeInfo]
  );

  // ==========================================================================
  // DELETE OPERATION
  // ==========================================================================

  const deleteStakeholderType = useCallback(
    async (typeId: number) => {
      setError(null);
      setProcessingId(typeId);

      try {
        const { error } = await supabase
          .from("stakeholder_types")
          .delete()
          .eq("id", typeId);

        if (error) throw error;

        return true;
      } catch (error) {
        console.error("Error deleting stakeholder type:", error);
        setError("Failed to delete stakeholder type");
        return false;
      } finally {
        setProcessingId(null);
      }
    },
    []
  );

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================

  const activeStakeholderTypes = useMemo(
    () => stakeholderTypes.filter((t) => t.is_active),
    [stakeholderTypes]
  );

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    // State
    stakeholderTypes,
    loading,
    error,
    processingId,

    // Computed
    activeStakeholderTypes,

    // Operations
    fetchStakeholderTypes,
    fetchStakeholderTypeById,
    createStakeholderType,
    updateStakeholderType,
    deleteStakeholderType,
  };
}
