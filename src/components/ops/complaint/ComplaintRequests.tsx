"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  XCircle,
  Flag,
  User,
  Clock,
  Check,
  X,
  MessageSquare,
  FileText,
  AlertTriangle,
  List
} from "lucide-react";
import { extractFileNameFromStoragePath, extractFilenameFromUrl } from "@/lib/utils";
import { useEmployeesContext } from "@/contexts";
import { useComplaints } from "@/hooks/useComplaints";
import { useComplaintTypes } from "@/hooks/useConfigTypes";
import { toast } from "sonner";
import { Card, CardHeader, CardContent, StatusBadge, InfoRow } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/button";
import LoadingSection from "@/app/(home)/home/components/LoadingSection";
import { ComplaintCard } from "./ComplaintCard";

export default function ComplaintRequestsPage() {
  const [comment, setComment] = useState<string>("");
  const [currentlyProcessingId, setCurrentlyProcessingId] = useState<number | null>(null);
  const { employees } = useEmployeesContext();
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
    fetchComplaintRequests();
  }, []);

  useEffect(() => {
    
  }, [fetchEmployees]);

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

