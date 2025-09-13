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
import { extractFilenameFromUrl } from "@/lib/utils";
import { useEmployees } from "@/hooks/useEmployees";
import { useComplaints } from "@/hooks/useComplaints";
import { useComplaintTypes } from "@/hooks/useConfigTypes";
import { toast } from "sonner";
import { Card, CardHeader, CardContent, StatusBadge, InfoRow } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/button";
import LoadingSection from "@/app/(home)/home/components/LoadingSection";

export default function ComplaintRequestsPage() {
  const [comment, setComment] = useState<string>("");
  const [currentlyProcessingId, setCurrentlyProcessingId] = useState<number | null>(null);
  const { employees, fetchEmployees } = useEmployees();
  const { complaintTypes, fetchComplaintTypes } = useComplaintTypes();
  const {
    complaints,
    loading,
    error,
    processingId,
    fetchComplaints,
    updateComplaint,
  } = useComplaints();

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    fetchComplaintTypes();
  }, [fetchComplaintTypes]);

  const handleUpdateRequest = async (action: string, id: number) => {
    setCurrentlyProcessingId(id);
    const updateData = {
      status: action,
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
      fetchComplaints();
    } else {
      toast.error(`Failed to ${action.toLowerCase()} complaint`);
    }
    setCurrentlyProcessingId(null);
  };

  return (
    <AnimatePresence mode="wait">
      {loading && <LoadingSection 
          text="Loading complaint requests..."
          icon={List}
          color="blue"
          />}
      
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <XCircle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-red-500 font-medium">{error}</p>
        </div>
      )}
      
      {!loading && !error && (
        <div className="space-y-6">
          {complaints.length > 0 ? (
            <div className="space-y-4">
              <AnimatePresence>
                {complaints.map((complaint) => (
                  <ComplaintCard
                    key={complaint.id}
                    complaint={complaint}
                    employees={employees}
                    complaintTypes={complaintTypes}
                    comment={comment}
                    setComment={setComment}
                    onAccept={() => handleUpdateRequest("Resolved", complaint.id)}
                    onReject={() => handleUpdateRequest("Resolved", complaint.id)}
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

function ComplaintCard({
  complaint,
  employees,
  complaintTypes,
  comment,
  setComment,
  onAccept,
  onReject,
  isProcessing
}: {
  complaint: any;
  employees: any[];
  complaintTypes: any[];
  comment: string;
  setComment: (value: string) => void;
  onAccept: () => void;
  onReject: () => void;
  isProcessing: boolean;
}) {
  const complainer = employees.find(emp => emp.id === complaint.complainer_id);
  const against = employees.find(emp => emp.id === complaint.against_whom);
  const type = complaintTypes.find(type => type.id === complaint.complaint_type_id);

  const actions = (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onReject}
        disabled={isProcessing}
        className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
      >
        <X size={14} />
        Reject
      </Button>
      <Button
        variant="primary"
        size="sm"
        onClick={onAccept}
        disabled={isProcessing}
        className="flex items-center gap-2"
        isLoading={isProcessing}
      >
        <Check size={14} />
        Accept
      </Button>
    </div>
  );

  return (
    <Card>
      <CardHeader
        title={type?.name || "Unknown Complaint Type"}
        subtitle={complaint.anonymous ? "Anonymous Complaint" : "Named Complaint"}
        icon={<AlertTriangle size={20} className="text-red-500" />}
        action={actions}
      />
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <InfoRow
            icon={<User size={16} />}
            label="Complainant"
            value={complaint.anonymous ? "Anonymous" : (complainer?.name || "Unknown")}
          />
          <InfoRow
            icon={<User size={16} />}
            label="Against"
            value={against?.name || "Unknown"}
          />
        </div>

        <StatusBadge status="Pending" variant="warning" size="sm" />

        {complaint.description && (
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Description:</h4>
            <p className="text-sm text-gray-600">{complaint.description}</p>
          </div>
        )}

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MessageSquare size={16} className="inline mr-2" />
              Add Comment
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add your feedback here..."
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {complaint.attachments && complaint.attachments.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FileText size={16} />
                Attachments
              </h4>
              <div className="flex flex-wrap gap-2">
                {complaint.attachments.map((attachment: string, idx: number) => (
                  <a
                    key={idx}
                    href={attachment}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700 text-xs px-3 py-2 rounded-md"
                  >
                    <FileText size={12} />
                    {extractFilenameFromUrl(attachment)}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
