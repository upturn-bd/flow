"use client";

import { ComplaintsType } from "@/lib/types/schemas";
import { useBaseEntity } from "./core/useBaseEntity";

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
    tableName: "complaints", 
    entityName: "complaint",
    companyScoped: true,
  });
  
  return {
    ...baseResult,
    complaints: baseResult.items,
    fetchComplaints: baseResult.fetchItems,
    fetchComplaintHistory: baseResult.fetchItems,
    updateComplaint: baseResult.updateItem,
    processingId: baseResult.updating,
  };
}
