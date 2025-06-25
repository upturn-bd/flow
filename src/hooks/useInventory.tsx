"use client";

import { RequisitionInventory } from "@/lib/types";
import { validateRequisitionInventory } from "@/lib/utils/validation";
import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { getCompanyId } from "@/lib/api/company/companyInfo";

export function useRequisitionInventories() {
  const [requisitionInventories, setRequisitionInventories] = useState<RequisitionInventory[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRequisitionInventories = useCallback(async () => {
    setLoading(true);
    try {
      const company_id = await getCompanyId();

      const { data, error } = await supabase
        .from("requisition_inventories")
        .select("*")
        .eq("company_id", company_id);

      if (error) throw error;
      setRequisitionInventories(data || []);
      return data;
    } catch (error) {
      console.error(error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createRequisitionInventory = useCallback(async (values: RequisitionInventory) => {
    try {
      const company_id = await getCompanyId();
      
      // Validate the payload
      const validation = validateRequisitionInventory(values);
      if (!validation.success) {
        const error = new Error("Validation failed");
        (error as any).issues = validation.errors;
        throw error;
      }

      const { data, error } = await supabase.from("requisition_inventories").insert({
        ...values,
        company_id,
      });

      if (error) throw error;
      return { success: true, status: 200, data };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }, []);

  const updateRequisitionInventory = useCallback(async (values: RequisitionInventory) => {
    try {
      const company_id = await getCompanyId();
      
      // Validate the payload
      const validation = validateRequisitionInventory(values);
      if (!validation.success) {
        const error = new Error("Validation failed");
        (error as any).issues = validation.errors;
        throw error;
      }

      const { data, error } = await supabase
        .from("requisition_inventories")
        .update(values)
        .eq("id", values.id)
        .eq("company_id", company_id);

      if (error) throw error;
      return { success: true, status: 200, data };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }, []);

  const deleteRequisitionInventory = useCallback(async (id: number) => {
    try {
      const company_id = await getCompanyId();

      const { error } = await supabase
        .from("requisition_inventories")
        .delete()
        .eq("id", id)
        .eq("company_id", company_id);

      if (error) throw error;
      return { success: true, status: 200, data: null };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }, []);

  return {
    requisitionInventories,
    loading,
    fetchRequisitionInventories,
    createRequisitionInventory,
    updateRequisitionInventory,
    deleteRequisitionInventory,
  };
}
