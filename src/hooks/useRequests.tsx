"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { getCompanyId, getUserInfo } from "@/lib/auth/getUser";

// A generic hook for managing different request types
export function useRequests<T extends { id: number }>(
  tableName: string,
  ownerIdField: string = 'requested_to',
  commentField: string = 'comment'
) {
  const [requests, setRequests] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchRequests = useCallback(async (status: string = "Pending") => {
    setLoading(true);
    
    try {
      const user = await getUserInfo();
      const company_id = await getCompanyId();
      
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .eq("company_id", company_id)
        .eq(ownerIdField, user.id)
        .eq("status", status);

      if (error) {
        setError(`Failed to fetch ${tableName}`);
        throw error;
      }

      setRequests(data || []);
      return data;
    } catch (error) {
      setError(`Failed to fetch ${tableName}`);
      console.error(error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [tableName, ownerIdField]);

  const fetchHistory = useCallback(async () => {
    return fetchRequests("Pending");
  }, [fetchRequests]);

  const updateRequest = useCallback(async (action: string, id: number, comment: string) => {
    setProcessingId(id);
    
    try {
      const user = await getUserInfo();
      const company_id = await getCompanyId();
      
      // Build update object based on field names
      const updateObj: Record<string, any> = {
        status: action,
        approved_by_id: user.id,
      };
      
      // Add comment field with the appropriate field name
      updateObj[commentField] = comment;
      
      const { data, error } = await supabase
        .from(tableName)
        .update(updateObj)
        .eq("company_id", company_id)
        .eq("id", id);
      
      if (error) {
        setError(`Failed to update ${tableName}`);
        throw error;
      }
      
      // Refresh the requests
      await fetchRequests();
      return true;
    } catch (error) {
      setError(`Failed to update ${tableName}`);
      console.error(error);
      return false;
    } finally {
      setProcessingId(null);
    }
  }, [tableName, commentField, fetchRequests]);

  return {
    requests,
    loading,
    error,
    processingId,
    fetchRequests,
    fetchHistory,
    updateRequest
  };
}

// Hooks for specific request types using the generic hook
export function useSettlementRequests() {
  const {
    requests: settlementRequests,
    loading,
    error,
    processingId,
    fetchRequests: fetchSettlementRequests,
    fetchHistory: fetchSettlementHistory,
    updateRequest: updateSettlementRequest
  } = useRequests('settlement_records');
  
  return {
    settlementRequests,
    loading,
    error,
    processingId,
    fetchSettlementRequests,
    fetchSettlementHistory,
    updateSettlementRequest
  };
}

export function useRequisitionRequests() {
  const {
    requests: requisitionRequests,
    loading,
    error,
    processingId,
    fetchRequests: fetchRequisitionRequests,
    fetchHistory: fetchRequisitionHistory,
    updateRequest: updateRequisitionRequest
  } = useRequests('requisition_records', 'asset_owner');
  
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

export function useLeaveRequests() {
  const {
    requests: leaveRequests,
    loading,
    error,
    processingId,
    fetchRequests: fetchLeaveRequests,
    fetchHistory: fetchLeaveHistory,
    updateRequest: updateLeaveRequest
  } = useRequests('leave_records', 'requested_to', 'remarks');
  
  return {
    leaveRequests,
    loading,
    error,
    processingId,
    fetchLeaveRequests,
    fetchLeaveHistory,
    updateLeaveRequest
  };
}

export function useComplaints() {
  const {
    requests: complaints,
    loading,
    error,
    processingId,
    fetchRequests: fetchComplaints,
    fetchHistory: fetchComplaintHistory,
    updateRequest: updateComplaint
  } = useRequests('complaint_records');
  
  return {
    complaints,
    loading,
    error,
    processingId,
    fetchComplaints,
    fetchComplaintHistory,
    updateComplaint
  };
} 