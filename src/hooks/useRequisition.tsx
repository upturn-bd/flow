"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { getEmployeeInfo } from "@/lib/api/employee";
import { getCompanyId } from "@/lib/api/company/companyInfo";
import { RequisitionState } from "@/components/operations-and-services/requisition/RequisitionCreatePage";

export function useRequisitionRequests() {
  const [requisitionRequests, setRequisitionRequests] = useState<RequisitionState[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchRequisitionRequests = useCallback(async (status: string = "Pending") => {
    setLoading(true);
    
    try {
      const user = await getEmployeeInfo();
      const company_id = await getCompanyId();
      
      const { data, error } = await supabase
        .from("requisition_records")
        .select("*")
        .eq("company_id", company_id)
        .eq("asset_owner", user.id)
        .eq("status", status);

      if (error) {
        setError("Failed to fetch requisition requests");
        throw error;
      }

      setRequisitionRequests(data || []);
      return data;
    } catch (error) {
      setError("Failed to fetch requisition requests");
      console.error(error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRequisitionHistory = useCallback(async () => {
    return fetchRequisitionRequests("Pending");
  }, [fetchRequisitionRequests]);

  const updateRequisitionRequest = useCallback(async (action: string, id: number, comment: string) => {
    setProcessingId(id);
    
    try {
      const user = await getEmployeeInfo();
      const company_id = await getCompanyId();
      
      const { data, error } = await supabase
        .from("requisition_records")
        .update({
          status: action,
          approved_by_id: user.id,
          comment: comment,
        })
        .eq("company_id", company_id)
        .eq("id", id);
      
      if (error) {
        setError("Failed to update requisition request");
        throw error;
      }
      
      // Refresh the requests
      await fetchRequisitionRequests();
      return true;
    } catch (error) {
      setError("Failed to update requisition request");
      console.error(error);
      return false;
    } finally {
      setProcessingId(null);
    }
  }, [fetchRequisitionRequests]);

  return {
    requisitionRequests,
    loading,
    error,
    processingId,
    fetchRequisitionRequests,
    fetchRequisitionHistory,
    updateRequisitionRequest
  };
} 