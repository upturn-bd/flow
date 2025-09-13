"use client";

import { ComplaintsType } from "@/lib/types/schemas";
import { useBaseEntity } from "./core/useBaseEntity";
import { useNotifications } from "./useNotifications";
import { getEmployeeInfo } from "@/lib/utils/auth";

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
    tableName: "complaint_records",
    entityName: "complaint",
    companyScoped: true,
  });

  const { createNotification } = useNotifications()

  const updateComplaint = async (complaintId: number, complaintData: any, againstName: string)  => {
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
        action_url: '/operations-and-services/services/complaint',
        company_id: user.company_id,
        department_id: user.department_id
      });


      return result;
    } catch (error) {
      console.log(error)
      throw error;
    }
  }

  return {
    ...baseResult,
    complaints: baseResult.items,
    fetchComplaints: baseResult.fetchItems,
    fetchComplaintHistory: baseResult.fetchItems,
    updateComplaint,
    processingId: baseResult.updating,
  };
}
