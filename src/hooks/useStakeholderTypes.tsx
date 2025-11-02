"use client";

import { useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import { getEmployeeInfo, getCompanyId } from "@/lib/utils/auth";
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
      const company_id = await getCompanyId();

      let query = supabase
        .from("stakeholder_types")
        .select("*")
        .eq("company_id", company_id);

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
  }, []);

  const fetchStakeholderTypeById = useCallback(async (typeId: number) => {
    setLoading(true);
    setError(null);

    try {
      const company_id = await getCompanyId();

      const { data, error } = await supabase
        .from("stakeholder_types")
        .select("*")
        .eq("company_id", company_id)
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
  }, []);

  // ==========================================================================
  // CREATE OPERATION
  // ==========================================================================

  const createStakeholderType = useCallback(
    async (typeData: StakeholderTypeFormData) => {
      setError(null);
      try {
        const company_id = await getCompanyId();
        const employeeInfo = await getEmployeeInfo();

        const { data, error } = await supabase
          .from("stakeholder_types")
          .insert([
            {
              ...typeData,
              company_id,
              created_by: employeeInfo?.id,
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
    []
  );

  // ==========================================================================
  // UPDATE OPERATION
  // ==========================================================================

  const updateStakeholderType = useCallback(
    async (typeId: number, typeData: Partial<StakeholderTypeFormData>) => {
      setError(null);
      setProcessingId(typeId);

      try {
        const employeeInfo = await getEmployeeInfo();

        const { data, error } = await supabase
          .from("stakeholder_types")
          .update({
            ...typeData,
            updated_by: employeeInfo?.id,
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
    []
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
