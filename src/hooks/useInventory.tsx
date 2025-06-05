"use client";


import { requisitionInventorySchema } from "@/lib/types";
import { useState, useCallback } from "react";
import { z } from "zod";
import { supabase } from "@/lib/supabase/client";
import { getCompanyId } from "@/lib/api/company/companyInfo";

export type RequisitionInventory = z.infer<typeof requisitionInventorySchema>;

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
      const validated = requisitionInventorySchema.safeParse(values);
      if (!validated.success) throw validated.error;

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
      const validated = requisitionInventorySchema.safeParse(values);
      if (!validated.success) throw validated.error;

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
