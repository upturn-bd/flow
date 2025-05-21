"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { getCompanyId } from "@/lib/auth/getUser";

// A generic hook for managing configuration types
export function useConfigTypes<T extends { id?: number, company_id?: number | null }>(
  tableName: string
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const company_id = await getCompanyId();
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .eq("company_id", company_id);

      if (error) throw error;
      setItems(data || []);
      return data;
    } catch (error) {
      setError(`Failed to fetch ${tableName}`);
      console.error(error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [tableName]);

  const createItem = useCallback(async (values: T) => {
    try {
      const company_id = await getCompanyId();
      const { data, error } = await supabase
        .from(tableName)
        .insert({
          ...values,
          company_id,
        });

      if (error) throw error;
      
      // Refetch the items to update the list
      await fetchItems();
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }, [tableName, fetchItems]);

  const updateItem = useCallback(async (values: T) => {
    try {
      const company_id = await getCompanyId();
      const { data, error } = await supabase
        .from(tableName)
        .update({
          ...values,
          company_id,
        })
        .eq("id", values.id);

      if (error) throw error;
      
      // Refetch the items to update the list
      await fetchItems();
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }, [tableName, fetchItems]);

  const deleteItem = useCallback(async (id: number) => {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      // Refetch the items to update the list
      await fetchItems();
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }, [tableName, fetchItems]);

  return {
    items,
    loading,
    error,
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
  };
}

// Re-exports for specific type hooks
import { z } from "zod";
import { 
  requisitionTypeSchema, 
  complaintsTypeSchema,
  leaveTypeSchema,
  requisitionInventorySchema,
  claimTypeSchema
} from "@/lib/types";

// Types
export type RequisitionType = z.infer<typeof requisitionTypeSchema>;
export type ComplaintType = z.infer<typeof complaintsTypeSchema>;
export type LeaveType = z.infer<typeof leaveTypeSchema>;
export type RequisitionInventory = z.infer<typeof requisitionInventorySchema>;
export type ClaimType = z.infer<typeof claimTypeSchema>;

// Specific hooks using the generic hook
export function useRequisitionTypes() {
  const { 
    items: requisitionTypes, 
    loading, 
    error, 
    fetchItems: fetchRequisitionTypes,
    createItem: createRequisitionType,
    updateItem: updateRequisitionType,
    deleteItem: deleteRequisitionType
  } = useConfigTypes<RequisitionType>('requisition_types');
  
  return {
    requisitionTypes,
    loading,
    error,
    fetchRequisitionTypes,
    createRequisitionType,
    updateRequisitionType,
    deleteRequisitionType
  };
}

export function useComplaintTypes() {
  const { 
    items: complaintTypes, 
    loading, 
    error, 
    fetchItems: fetchComplaintTypes,
    createItem: createComplaintType,
    updateItem: updateComplaintType,
    deleteItem: deleteComplaintType
  } = useConfigTypes<ComplaintType>('complaint_types');
  
  return {
    complaintTypes,
    loading,
    error,
    fetchComplaintTypes,
    createComplaintType,
    updateComplaintType,
    deleteComplaintType
  };
}

export function useLeaveTypes() {
  const { 
    items: leaveTypes, 
    loading, 
    error, 
    fetchItems: fetchLeaveTypes,
    createItem: createLeaveType,
    updateItem: updateLeaveType,
    deleteItem: deleteLeaveType
  } = useConfigTypes<LeaveType>('leave_types');
  
  return {
    leaveTypes,
    loading,
    error,
    fetchLeaveTypes,
    createLeaveType,
    updateLeaveType,
    deleteLeaveType
  };
}

export function useRequisitionInventories() {
  const { 
    items: requisitionInventories, 
    loading, 
    error, 
    fetchItems: fetchRequisitionInventories,
    createItem: createRequisitionInventory,
    updateItem: updateRequisitionInventory,
    deleteItem: deleteRequisitionInventory
  } = useConfigTypes<RequisitionInventory>('requisition_inventories');
  
  return {
    requisitionInventories,
    loading,
    error,
    fetchRequisitionInventories,
    createRequisitionInventory,
    updateRequisitionInventory,
    deleteRequisitionInventory
  };
}

export function useClaimTypes() {
  const { 
    items: claimTypes, 
    loading, 
    error, 
    fetchItems: fetchClaimTypes,
    createItem: createClaimType,
    updateItem: updateClaimType,
    deleteItem: deleteClaimType
  } = useConfigTypes<ClaimType>('settlement_types');
  
  return {
    claimTypes,
    loading,
    error,
    fetchClaimTypes,
    createClaimType,
    updateClaimType,
    deleteClaimType
  };
} 