"use client";

import { RequisitionType } from "@/lib/types";
import { validateRequisitionType } from "@/lib/utils/validation";
import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { getCompanyId } from "@/lib/api/company/companyInfo";

export function useRequisitionTypes() {
  const [requisitionTypes, setRequisitionTypes] = useState<RequisitionType[]>(
    []
  );
  const [loading, setLoading] = useState(false);

  const fetchRequisitionTypes = useCallback(async () => {
    setLoading(true);
    try {
      const company_id = await getCompanyId();

      const { data, error } = await supabase
        .from("requisition_types")
        .select("*")
        .eq("company_id", company_id);

      if (error) throw error;
      setRequisitionTypes(data || []);
      return data;
    } catch (error) {
      console.error(error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createRequisitionType = useCallback(async (values: RequisitionType) => {
    try {
      const company_id = await getCompanyId();
      
      // Validate the payload
      const validation = validateRequisitionType(values);
      if (!validation.success) {
        const error = new Error("Validation failed");
        (error as any).issues = validation.errors;
        throw error;
      }

      const { data, error } = await supabase.from("requisition_types").insert({
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

  const deleteRequisitionType = useCallback(async (id: number) => {
    try {
      const company_id = await getCompanyId();

      const { error } = await supabase
        .from("requisition_types")
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
    requisitionTypes,
    loading,
    fetchRequisitionTypes,
    createRequisitionType,
    deleteRequisitionType,
  };
}
