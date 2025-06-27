"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { getEmployeeInfo } from "@/lib/api";
import { getCompanyId } from "@/lib/api";

export interface RequisitionState {
  id: number;
  requisition_category_id: number;
  item_id: number;
  quantity: number;
  date: string;
  from_time?: string;
  to_time?: string;
  description?: string;
  attachments?: string[];
  employee_id: number;
  company_id: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  approved_by_id?: number;
  comment?: string;
  asset_owner: number;
}

export function useRequisitionRequests() {
  const [requisitionRequests, setRequisitionRequests] = useState<RequisitionState[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchRequisitionRequests = useCallback(
    async (status: string = "Pending") => {
      setLoading(true);
      setError(null);

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
    },
    []
  );

  const fetchRequisitionHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const user = await getEmployeeInfo();
      const company_id = await getCompanyId();

      // Fetch both approved and rejected requests
      const { data, error } = await supabase
        .from("requisition_records")
        .select("*")
        .eq("company_id", company_id);
        // .eq("asset_owner", user.id);

      if (error) {
        setError("Failed to fetch requisition history");
        throw error;
      }

      setRequisitionRequests(data || []);
      return data;
    } catch (error) {
      setError("Failed to fetch requisition history");
      console.error(error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const updateRequisitionRequest = useCallback(
    async (action: string, id: number, comment: string) => {
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
    },
    [fetchRequisitionRequests]
  );

  return {
    requisitionRequests,
    loading,
    error,
    processingId,
    fetchRequisitionRequests,
    fetchRequisitionHistory,
    updateRequisitionRequest,
  };
}
