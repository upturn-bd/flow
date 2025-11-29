"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  PackageOpen, 
  Truck 
} from "lucide-react";
import { toast } from "sonner";
import { useEmployees } from "@/hooks/useEmployees";
import { useRequisitionInventories } from "@/hooks/useConfigTypes";
import { useRequisitionTypes } from "@/hooks/useConfigTypes";
import { useRequisitionRequests, RequisitionState } from "@/hooks/useRequisition";
import { useAuth } from "@/lib/auth/auth-context";
import { extractFileNameFromStoragePath } from "@/lib/utils";
import LoadingSection from "@/app/(home)/home/components/LoadingSection";
import { EmptyState } from "@/components/ui/EmptyState";
import { RequisitionCard } from "./RequisitionCard";
import RequisitionEditModal from "./RequisitionEditModal";

export default function RequisitionRequestsPage() {
  const [comment, setComment] = useState<string>("");
  const { employees, fetchEmployees } = useEmployees();
  const { requisitionTypes, fetchRequisitionTypes } = useRequisitionTypes();
  const { requisitionInventories, fetchRequisitionInventories } = useRequisitionInventories();

  const { 
    requisitionRequests, 
    loading, 
    error, 
    processingId, 
    fetchRequisitionRequests, 
    updateRequisitionRequest,
    updateRequisition,
  } = useRequisitionRequests();

  const { employeeInfo, canWrite, canApprove: canApprovePermission } = useAuth();

  // State for edit modal
  const [editingRequisition, setEditingRequisition] = useState<RequisitionState | null>(null);

  // Check if user can edit a requisition
  const canEditRequisition = useCallback((req: RequisitionState) => {
    if (!employeeInfo) return false;
    
    const isOwner = req.employee_id === employeeInfo.id;
    const hasWritePermission = canWrite('requisition');
    const hasApprovalPermission = canApprovePermission('requisition');
    
    return isOwner || hasWritePermission || hasApprovalPermission;
  }, [employeeInfo, canWrite, canApprovePermission]);

  const handleEditClick = (req: RequisitionState) => {
    setEditingRequisition(req);
  };

  const handleCloseEditModal = () => {
    setEditingRequisition(null);
  };

  const handleUpdateRequisition = async (id: number, data: Partial<RequisitionState>) => {
    const result = await updateRequisition(id, data);
    if (result) {
      // Refresh the requests list
      fetchRequisitionRequests("Pending");
    }
    return result;
  };

  useEffect(() => {
    fetchRequisitionRequests("Pending");
  }, [fetchRequisitionRequests]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    fetchRequisitionTypes();
    fetchRequisitionInventories();
  }, [fetchRequisitionTypes, fetchRequisitionInventories]);

  // Adapter to match RequisitionCard's expected handler signature:
  // (status: string, reqId: string, employeeId: string, comment?: string) => void
  const handleUpdateRequest = (
    status: string,
    reqId: string,
    employeeId: string,
    commentParam?: string
  ) => {
    (async () => {
      const action = status === "Approved" ? "Approved" : "Rejected";
      const id = parseInt(reqId as any, 10) || 0;
      const useComment = commentParam ?? comment;
      const success = await updateRequisitionRequest(action as "Approved" | "Rejected", id, useComment, employeeId);
      if (success) {
        toast.success(`Request ${action.toLowerCase()} successfully`);
        setComment("");
      }
    })();
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h1 className="text-xl font-bold text-blue-700">Requisition Requests</h1>

      {loading && (
        <LoadingSection 
          text="Loading requisition requests..."
          icon={Truck}
          color="blue"
        />
      )}
      
      {error && !loading && (
        <EmptyState 
          icon={<PackageOpen className="h-12 w-12" />}
          title="Error loading requests"
          description={error}
        />
      )}
      
      {!loading && !error && (
        <>
          {requisitionRequests.length > 0 ? (
            <div className="space-y-4">
              <AnimatePresence>
                {requisitionRequests.map((req) => (
                  <RequisitionCard
                    key={req.id}
                    req={req}
                    mode="request"
                    requisitionTypes={requisitionTypes}
                    requisitionInventories={requisitionInventories}
                    employees={employees}
                    extractFileNameFromStoragePath={extractFileNameFromStoragePath}
                    handleUpdateRequest={handleUpdateRequest}
                    processingId={processingId?.toString()}
                    canEdit={canEditRequisition(req)}
                    onEdit={handleEditClick}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <EmptyState 
              icon={<PackageOpen className="h-12 w-12" />}
              title="No pending requisition requests"
              description="When users submit requisition requests, they'll appear here"
            />
          )}
        </>
      )}

      {/* Edit Modal */}
      {editingRequisition && (
        <RequisitionEditModal
          isOpen={!!editingRequisition}
          requisition={editingRequisition}
          onClose={handleCloseEditModal}
          onSubmit={handleUpdateRequisition}
        />
      )}
    </div>
  );
}
