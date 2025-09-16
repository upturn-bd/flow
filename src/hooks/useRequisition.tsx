"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { getEmployeeInfo, getCompanyId } from "@/lib/utils/auth";
import { useNotifications } from "./useNotifications";

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
  attachment_download_urls?: string[];
  employee_id: string;
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
  const { createNotification } = useNotifications();

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
    async (action: string, id: number, comment: string, employee_id: string) => {
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

        const recipients = [employee_id].filter(Boolean) as string[];
        createNotification({
          title: `Requisition ${action}`,
          message: `Your requisition request has been ${action.toLowerCase()}.`,
          priority: 'normal',
          type_id: 6,
          recipient_id: recipients,
          action_url: '/operations-and-services/services/requisition',
          company_id: user.company_id,
          department_id: user.department_id
        })

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
