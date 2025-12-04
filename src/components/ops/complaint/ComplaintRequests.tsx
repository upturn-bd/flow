"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader,
  XCircle,
  Flag,
  User,
  Clock,
  Check,
  X,
  MessageCircle,
  FileText,
  AlertTriangle,
  List
} from "@/lib/icons";
import { extractFileNameFromStoragePath, extractFilenameFromUrl } from "@/lib/utils";
import { useEmployees } from "@/hooks/useEmployees";
import { useComplaints } from "@/hooks/useComplaints";
import { useComplaintTypes } from "@/hooks/useConfigTypes";
import { toast } from "sonner";
import { Card, CardHeader, CardContent, StatusBadge, InfoRow } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/button";
import LoadingSection from "@/app/(home)/home/components/LoadingSection";
import { ComplaintCard } from "./ComplaintCard";
import { extractEmployeeIdsFromComplaints } from "@/lib/utils/project-utils";

export default function ComplaintRequestsPage() {
  const [comment, setComment] = useState<string>("");
  const [currentlyProcessingId, setCurrentlyProcessingId] = useState<number | null>(null);
  const { employees, fetchEmployeesByIds } = useEmployees();
  const { complaintTypes, fetchComplaintTypes } = useComplaintTypes();
  const {
    complaints,
    complaintRequests,
    loading,
    error,
    requestLoading,
    processingId,
    fetchComplaints,
    fetchComplaintRequests,
    updateComplaint,
  } = useComplaints();

  useEffect(() => {
    const initData = async () => {
      const requests = await fetchComplaintRequests();
      // Only fetch employees that are referenced in the requests
      if (requests && requests.length > 0) {
        const employeeIds = extractEmployeeIdsFromComplaints(requests);
        if (employeeIds.length > 0) {
          fetchEmployeesByIds(employeeIds);
        }
      }
    };
    initData();
  }, [fetchComplaintRequests, fetchEmployeesByIds]);

  useEffect(() => {
    fetchComplaintTypes();
  }, [fetchComplaintTypes]);

  const handleUpdateRequest = async (action: string, id: number) => {
    setCurrentlyProcessingId(id);
    const updateData = {
      status: "Resolved",
      comment: comment
    };

    console.log(updateData)

    const complaint = complaints.find(comp => comp.id === id)
    const againstId = complaint?.against_whom
    const againstEmp = employees.find(emp => emp.id === againstId)

    const result = await updateComplaint(id, updateData, againstEmp?.name || "");
    if (result.success) {
      toast.success(`Complaint ${action.toLowerCase()} successfully`);
      setComment("");
      fetchComplaintRequests();
    } else {
      toast.error(`Failed to ${action.toLowerCase()} complaint`);
    }
    setCurrentlyProcessingId(null);
  };

  return (
    <AnimatePresence mode="wait">
      {requestLoading && <LoadingSection
        text="Loading complaint requests..."
        icon={List}
        color="blue"
      />}

      {error && !requestLoading && (
        <div className="flex flex-col items-center justify-center py-16">
          <XCircle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-red-500 font-medium">{error}</p>
        </div>
      )}

      {!requestLoading && !error && (
        <div className="space-y-6">
          {complaintRequests.length > 0 ? (
            <div className="space-y-4">
              <AnimatePresence>
                {complaintRequests.map((complaint) => (
                  <ComplaintCard
                    key={complaint.id}
                    complaint={complaint}
                    employees={employees}
                    complaintTypes={complaintTypes}
                    extractFileNameFromStoragePath={extractFileNameFromStoragePath}
                    mode="request"
                    onAccept={() => handleUpdateRequest("Accepted", complaint.id)}
                    onReject={() => handleUpdateRequest("Rejected", complaint.id)}
                    isProcessing={currentlyProcessingId === complaint.id}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <EmptyState
              icon={<Flag className="w-12 h-12" />}
              title="No pending complaint requests"
              description="When users submit complaints, they'll appear here for review."
            />
          )}
        </div>
      )}
    </AnimatePresence>
  );
}

