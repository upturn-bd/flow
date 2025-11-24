"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  PackageOpen, 
  Truck 
} from "lucide-react";
import { toast } from "sonner";
import { useEmployeesContext } from "@/contexts";
import { useRequisitionInventories } from "@/hooks/useConfigTypes";
import { useRequisitionTypes } from "@/hooks/useConfigTypes";
import { useRequisitionRequests } from "@/hooks/useRequisition";
import { extractFileNameFromStoragePath } from "@/lib/utils";
import LoadingSection from "@/app/(home)/home/components/LoadingSection";
import { EmptyState } from "@/components/ui/EmptyState";
import { RequisitionCard } from "./RequisitionCard";

export default function RequisitionRequestsPage() {
  const [comment, setComment] = useState<string>("");
  const { employees } = useEmployees();
  const { requisitionTypes, fetchRequisitionTypes } = useRequisitionTypes();
  const { requisitionInventories, fetchRequisitionInventories } = useRequisitionInventories();

  const { 
    requisitionRequests, 
    loading, 
    error, 
    processingId, 
    fetchRequisitionRequests, 
    updateRequisitionRequest 
  } = useRequisitionRequests();

  useEffect(() => {
    fetchRequisitionRequests("Pending");
  }, [fetchRequisitionRequests]);

  useEffect(() => {
    
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
    <div className="p-6 max-w-5xl mx-auto space-y-6">
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
                    mode="request" // ✅ request mode
                    requisitionTypes={requisitionTypes}
                    requisitionInventories={requisitionInventories}
                    employees={employees}
                    extractFileNameFromStoragePath={extractFileNameFromStoragePath}
                    handleUpdateRequest={handleUpdateRequest}
                    processingId={processingId?.toString()}
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
    </div>
  );
}
