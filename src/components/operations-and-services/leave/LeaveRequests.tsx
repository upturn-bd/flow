"use client";
import React, { useEffect, useState } from "react";
import { useEmployees } from "@/hooks/useEmployees";
import { toast } from "sonner";
import { useLeaveTypes } from "@/hooks/useConfigTypes";
import { Card, CardHeader, CardContent, StatusBadge, InfoRow } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/button";
import { Calendar, User, FileText, MessageSquare, Check, X, CalendarDays } from "lucide-react";
import LoadingSection from "@/app/(home)/home/components/LoadingSection";
import { useLeaveRequests } from "@/hooks/useLeaveManagement";
import { set } from "react-hook-form";

// Add this interface
interface LeaveRequest {
  id: number;
  type_id: number;
  employee_id: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
}

export default function LeaveRequestsPage() {
  const [comment, setComment] = useState<string>("");
  const [currentlyProcessingId, setCurrentlyProcessingId] = useState<number | null>(null);

  const { employees, fetchEmployees } = useEmployees();
  const { leaveTypes, fetchLeaveTypes } = useLeaveTypes();
  const {
    leaveRequests,
    loading,
    error,
    fetchLeaveRequests,
    updateLeaveRequest
  } = useLeaveRequests();

  useEffect(() => {
    fetchLeaveRequests();
    fetchEmployees();
    fetchLeaveTypes();
  }, []);

  const handleUpdateRequest = async (action: string, id: number) => {
    setCurrentlyProcessingId(id);
    const updateData = { status: action, remarks: comment };
    const result = await updateLeaveRequest(id, updateData);
    if (result.success) {
      toast.success(`Leave request ${action.toLowerCase()} successfully`);
      fetchLeaveRequests();
    } else {
      toast.error(`Failed to ${action.toLowerCase()} leave request`);
    }
    setComment("");
    setCurrentlyProcessingId(null);
  };

  if (loading) {
    return (
      <LoadingSection
        text="Loading leave requests..."
        icon={Calendar}
        color="blue"
      />
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-red-500 mb-2">Error loading leave requests</div>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {leaveRequests.length > 0 ? (
        leaveRequests.map((req) => {
          const leaveReq = req as LeaveRequest;
          return (
            <LeaveRequestCard
              key={leaveReq.id}
              request={leaveReq}
              employees={employees}
              leaveTypes={leaveTypes}
              comment={comment}
              setComment={setComment}
              onApprove={() => handleUpdateRequest("Accepted", leaveReq.id)}
              onReject={() => handleUpdateRequest("Rejected", leaveReq.id)}
              isProcessing={currentlyProcessingId === leaveReq.id}
            />
          );
        })
      ) : (
        <EmptyState
          icon={<CalendarDays className="w-12 h-12" />}
          title="No leave requests"
          description="There are no pending leave requests at the moment."
        />
      )}
    </div>
  );
}

function LeaveRequestCard({
  request,
  employees,
  leaveTypes,
  comment,
  setComment,
  onApprove,
  onReject,
  isProcessing
}: {
  request: LeaveRequest;
  employees: any[];
  leaveTypes: any[];
  comment: string;
  setComment: (value: string) => void;
  onApprove: () => void;
  onReject: () => void;
  isProcessing: boolean;
}) {
  const employee = employees.find(emp => emp.id === request.employee_id);
  const leaveType = leaveTypes.find(type => type.id === request.type_id);

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
        onClick={onApprove}
        disabled={isProcessing}
        className="flex items-center gap-2"
        isLoading={isProcessing}
      >
        <Check size={14} />
        Approve
      </Button>
    </div>
  );

  return (
    <Card>
      <CardHeader
        title={`Leave Request #${request.id}`}
        subtitle={request.description}
        action={actions}
      />

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <InfoRow
            icon={<FileText size={16} />}
            label="Type"
            value={leaveType?.name || "Unknown"}
          />
          <InfoRow
            icon={<User size={16} />}
            label="Employee"
            value={employee?.name || "Unknown"}
          />
          <InfoRow
            icon={<Calendar size={16} />}
            label="From"
            value={request.start_date}
          />
          <InfoRow
            icon={<Calendar size={16} />}
            label="To"
            value={request.end_date}
          />
        </div>

        <div className="space-y-3">
          <StatusBadge status={request.status} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MessageSquare size={16} className="inline mr-2" />
              Comment
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment for this decision..."
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
