"use client";

import { Lineage } from "@/lib/types/schemas";
import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { getCompanyId, DatabaseError } from "@/lib/utils/auth";

export function useLineage() {
  const [lineages, setLineages] = useState<Lineage[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchLineages = useCallback(async () => {
    setLoading(true);
    try {
      const company_id = await getCompanyId();

      const { data, error } = await supabase
        .from("lineages")
        .select("*")
        .eq("company_id", company_id);

      if (error) {
        throw new DatabaseError(`Failed to fetch lineages: ${error.message}`);
      }
      setLineages(data || []);
      return data;
    } catch (error) {
      console.error(error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createLineage = useCallback(async (values: Lineage[]) => {
    setCreating(true);
    try {
      const company_id = await getCompanyId();

      const validatedLineageData = values.map((lineage) => {
        return { ...lineage, company_id };
      });

      const { data, error } = await supabase
        .from("lineages")
        .insert(validatedLineageData);

      if (error) {
        throw new DatabaseError(`Failed to create lineage: ${error.message}`);
      }
      return { success: true, status: 200, data };
    } catch (error) {
      console.error("Error creating lineage:", error);
      throw error;
    } finally {
      setCreating(false);
    }
  }, []);

  const updateLineage = useCallback(async (values: Lineage[]) => {
    setUpdating(true);
    try {
      const company_id = await getCompanyId();
      const formattedPayload = values.map((lineage) => {
        const { id, ...rest } = lineage;
        return { ...rest, company_id };
      });

      const { data: existingLineages, error: fetchError } = await supabase
        .from("lineages")
        .delete()
        .eq("company_id", company_id)
        .eq("name", formattedPayload[0].name);

      if (fetchError) {
        throw new DatabaseError(`Failed to delete existing lineages: ${fetchError.message}`);
      }

      const { data, error } = await supabase
        .from("lineages")
        .insert(formattedPayload);

      if (error) {
        throw new DatabaseError(`Failed to update lineage: ${error.message}`);
      }
      return { success: true, status: 200, data };
    } catch (error) {
      console.error("Error updating lineage:", error);
      throw error;
    } finally {
      setUpdating(false);
    }
  }, []);

  const deleteLineage = useCallback(async (name: string) => {
    try {
      const company_id = await getCompanyId();

      const { error } = await supabase
        .from("lineages")
        .delete()
        .eq("name", name)
        .eq("company_id", company_id);

      if (error) {
        throw new DatabaseError(`Failed to delete lineage: ${error.message}`);
      }
      return { success: true, status: 200, data: { message: "Lineage deleted successfully" } };
    } catch (error) {
      console.error("Error deleting lineage:", error);
      throw error;
    }
  }, []);

  return {
    lineages,
    loading,
    creating,
    updating,
    fetchLineages,
    createLineage,
    deleteLineage,
    updateLineage,
  };
}
