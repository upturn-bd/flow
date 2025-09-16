"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { getCompanyId, DatabaseError } from "@/lib/utils/auth";

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

      if (error) {
        throw new DatabaseError(`Failed to fetch ${tableName}: ${error.message}`);
      }
      setItems(data || []);
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : `Failed to fetch ${tableName}`;
      setError(message);
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

      if (error) {
        throw new DatabaseError(`Failed to create ${tableName}: ${error.message}`);
      }
      
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

      if (error) {
        throw new DatabaseError(`Failed to update ${tableName}: ${error.message}`);
      }
      
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

      if (error) {
        throw new DatabaseError(`Failed to delete ${tableName}: ${error.message}`);
      }
      
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
import { 
  RequisitionType,
  ComplaintsType,
  LeaveType,
  RequisitionInventory,
  ClaimType
} from "@/lib/types/schemas";

// Types
export type { RequisitionType, LeaveType, RequisitionInventory, ClaimType };
export type ComplaintType = ComplaintsType;

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