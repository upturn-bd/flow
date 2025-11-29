"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { getEmployeeInfo, getCompanyId } from "@/lib/utils/auth";
import { useNotifications } from "./useNotifications";
import { usePermissions } from "./usePermissions";

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
  is_one_off?: boolean;
}

export function useRequisitionRequests() {
  const [requisitionRequests, setRequisitionRequests] = useState<RequisitionState[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const { createNotification } = useNotifications();
  const { canApprove, isSupervisorOf, getSubordinates } = usePermissions();

  const fetchRequisitionRequests = useCallback(
    async (status: string = "Pending", isGlobal: boolean = false) => {
      setLoading(true);
      setError(null);

      try {
        const user = await getEmployeeInfo();
        const company_id = await getCompanyId();

        let query = supabase
          .from("requisition_records")
          .select("*")
          .eq("company_id", company_id)
          .eq("status", status);

        if (!isGlobal) {
          // Get subordinate IDs if user is a supervisor
          const subordinateIds = await getSubordinates();
          
          // User can see requests where they are asset_owner OR from their subordinates
          if (subordinateIds.length > 0) {
            query = query.or(`asset_owner.eq.${user.id},employee_id.in.(${subordinateIds.join(',')})`);
          } else {
            query = query.eq("asset_owner", user.id);
          }
        }

        const { data, error } = await query;

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
    [getSubordinates]
  );


  const fetchRequisitionHistory = useCallback(async (isGlobal: boolean = false) => {
    setLoading(true);
    setError(null);

    try {
      const user = await getEmployeeInfo();
      const company_id = await getCompanyId();

      let query = supabase
        .from("requisition_records")
        .select("*")
        .eq("company_id", company_id);

      // Only filter by employee_id if not global
      if (!isGlobal) {
        query = query.eq("employee_id", user.id);
      }

      const { data, error } = await query;

      console.log(data);

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

        // Check permission: user must have requisition approval permission OR be supervisor of employee
        const hasTeamPermission = canApprove('requisition');
        const isSupervisor = await isSupervisorOf(employee_id);
        
        if (!hasTeamPermission && !isSupervisor) {
          setError("You do not have permission to update this requisition request");
          throw new Error("Permission denied");
        }

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
          action_url: '/ops/requisition',
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
    [fetchRequisitionRequests, canApprove, isSupervisorOf]
  );

  const updateRequisition = useCallback(
    async (
      id: number,
      updatedData: Partial<Omit<RequisitionState, 'id' | 'company_id' | 'employee_id' | 'status' | 'approved_by_id'>>
    ) => {
      setProcessingId(id);
      setError(null);

      try {
        const user = await getEmployeeInfo();
        const company_id = await getCompanyId();

        // Get the existing requisition to check ownership
        const { data: existingReq, error: fetchError } = await supabase
          .from("requisition_records")
          .select("*")
          .eq("id", id)
          .eq("company_id", company_id)
          .single();

        if (fetchError || !existingReq) {
          setError("Failed to find requisition");
          throw new Error("Requisition not found");
        }

        // Check permission: user must be the owner OR have requisition write permission OR be supervisor
        const isOwner = existingReq.employee_id === user.id;
        const hasWritePermission = canApprove('requisition');
        const isSupervisor = await isSupervisorOf(existingReq.employee_id);

        // Only allow edit if status is Pending
        if (existingReq.status !== 'Pending') {
          setError("Can only edit requisitions with Pending status");
          throw new Error("Cannot edit non-pending requisition");
        }

        if (!isOwner && !hasWritePermission && !isSupervisor) {
          setError("You do not have permission to edit this requisition");
          throw new Error("Permission denied");
        }

        const { data, error } = await supabase
          .from("requisition_records")
          .update(updatedData)
          .eq("company_id", company_id)
          .eq("id", id)
          .select()
          .single();

        if (error) {
          setError("Failed to update requisition");
          throw error;
        }

        // Refresh the history
        await fetchRequisitionHistory();

        return data;
      } catch (error) {
        setError("Failed to update requisition");
        console.error(error);
        return null;
      } finally {
        setProcessingId(null);
      }
    },
    [fetchRequisitionHistory, canApprove, isSupervisorOf]
  );

  return {
    requisitionRequests,
    loading,
    error,
    processingId,
    fetchRequisitionRequests,
    fetchRequisitionHistory,
    updateRequisitionRequest,
    updateRequisition,
  };
}
