"use client";

import { ComplaintsType } from "@/lib/types/schemas";
import { useBaseEntity } from "./core/useBaseEntity";
import { useNotifications } from "./useNotifications";
import { getEmployeeInfo } from "@/lib/utils/auth";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export type ComplaintType = ComplaintsType;

export interface ComplaintState {
  id: number;
  status: string;
  complaint_type_id: number;
  anonymous: boolean;
  complainer_id: string;
  against_whom: string;
  description: string;
  comment?: string;
  attachments?: string[];
  attachment_download_urls?: string[];
  company_id?: number;
  approved_by_id?: string;
}

// ===== COMPLAINT TYPES =====

export function useComplaintTypes() {
  return useBaseEntity<ComplaintType>({
    tableName: "complaint_types",
    entityName: "complaint type",
    companyScoped: true,
  });
}

// ===== COMPLAINTS =====

export function useComplaints() {
  const baseResult = useBaseEntity<ComplaintState>({
    tableName: "complaint_records",
    entityName: "complaint",
    companyScoped: true,
  });

  const [complaintRequests, setComplaintRequests] = useState<ComplaintState[]>([]);
  const [complaintHistory, setComplaintHistory] = useState<ComplaintState[]>([]);

  const [requestLoading, setRequestLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false)

  const { createNotification } = useNotifications()

  const updateComplaint = async (complaintId: number, complaintData: any, againstName: string) => {
    try {
      const result = await baseResult.updateItem(complaintId, complaintData);

      const user = await getEmployeeInfo()

      const recipients = [user.id].filter(Boolean) as string[]

      createNotification({
        title: "Complaint Request Update",
        message: `Your complaint request against ${againstName} has been ${complaintData.status.toLowerCase()}`,
        priority: 'normal',
        type_id: 6,
        recipient_id: recipients,
        action_url: '/ops/complaint',
        company_id: user.company_id,
        department_id: user.department_id
      });


      return result;
    } catch (error) {
      console.log(error)
      throw error;
    }
  }


  const fetchComplaintRequests = async (isGlobal: boolean = false) => {
    try {
      console.log("Fetching complaint requests...");
      setRequestLoading(true);
      const user = await getEmployeeInfo();

      // Start the query
      let query = supabase
        .from("complaint_records")
        .select("*")
        .eq("status", "Submitted")
        .eq("company_id", user.company_id)
        .order("created_at", { ascending: false });

      // Apply filter only if not global
      if (!isGlobal) {
        query = query.eq("requested_to", user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      setComplaintRequests(data || []);
      return data;
    } catch (error) {
      console.error(error);
      setComplaintRequests([]);
      return [];
    } finally {
      setRequestLoading(false);
    }
  };


  const fetchComplaintHistory = async (isGlobal: boolean = false) => {
    try {
      console.log("Fetching complaint history...");
      console.log("isGlobal:", isGlobal);
      setHistoryLoading(true);
      const user = await getEmployeeInfo();
      console.log("User info:", { userId: user.id, companyId: user.company_id });

      // Start the query
      let query = supabase
        .from("complaint_records")
        .select("*")
        .eq("company_id", user.company_id)
        .order("created_at", { ascending: false });

      // Apply filter only if not global
      if (!isGlobal) {
        console.log("Applying complainer_id filter:", user.id);
        query = query.eq("complainer_id", user.id);
      }

      const { data, error } = await query;

      console.log("Complaint history query result:", {
        totalCount: data?.length || 0,
        anonymousCount: data?.filter(c => c.anonymous)?.length || 0,
        nonAnonymousCount: data?.filter(c => !c.anonymous)?.length || 0,
        complaints: data?.map(c => ({ id: c.id, anonymous: c.anonymous, status: c.status, complainer_id: c.complainer_id }))
      });

      if (error) {
        console.error("Complaint history query error:", error);
        throw error;
      }

      setComplaintHistory(data || []);
      return data;
    } catch (error) {
      console.error(error);
      setComplaintHistory([]);
      return [];
    } finally {
      setHistoryLoading(false);
    }
  };


  return {
    ...baseResult,
    complaintRequests,
    complaintHistory,
    requestLoading,
    historyLoading,
    complaints: baseResult.items,
    fetchComplaints: baseResult.fetchItems,
    fetchComplaintRequests,
    fetchComplaintHistory,
    updateComplaint,
    processingId: baseResult.updating,
  };
}
