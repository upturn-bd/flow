"use client";

import { getCompanyId, getUserInfo } from "@/lib/auth/getUser";
import { supabase } from "@/lib/supabase/client";
import React, { useEffect, useState } from "react";
import { LeaveState } from "./LeaveCreatePage";
import { useEmployees } from "@/hooks/useEmployees";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useLeaveTypes } from "@/hooks/useConfigTypes";
import { useLeaveRequests } from "@/hooks/useRequests";

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
  const { employees, fetchEmployees } = useEmployees();
  const { leaveTypes, fetchLeaveTypes } = useLeaveTypes();
  const { 
    leaveRequests, 
    loading, 
    error, 
    processingId, 
    fetchLeaveRequests, 
    updateLeaveRequest 
  } = useLeaveRequests();

  useEffect(() => {
    fetchLeaveRequests("Pending");
  }, [fetchLeaveRequests]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    fetchLeaveTypes();
  }, [fetchLeaveTypes]);

  const handleUpdateRequest = async (action: string, id: number) => {
    await updateLeaveRequest(action, id, comment);
    setComment("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">{error}</div>
    );
  }
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-[#003366]">Leave Requests</h1>

      {leaveRequests.length > 0 &&
        leaveRequests.map((req) => {
          const leaveReq = req as unknown as LeaveRequest;
          return (
            <div
              key={leaveReq.id}
              className="bg-gray-100 rounded-xl p-6 space-y-4 shadow-sm"
            >
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div className="flex-1 space-y-2 text-sm text-gray-800">
                  <p>
                    <span className="font-bold">Category:</span>{" "}
                    {leaveTypes.find((type) => type.id === leaveReq.type_id)?.name}
                  </p>
                  <p>
                    <span className="font-bold">Requested By:</span>{" "}
                    {
                      employees.find(
                        (employee) => employee.id === leaveReq.employee_id
                      )?.name
                    }
                  </p>
                  <p>
                    <span className="font-bold">Description:</span>{" "}
                    {leaveReq.description}
                  </p>
                  <p>
                    <span className="font-bold">From:</span> {leaveReq.start_date}
                  </p>
                  <p>
                    <span className="font-bold">To:</span> {leaveReq.end_date}
                  </p>
                </div>

                <div className="flex-1 space-y-4">
                  {/* Comment */}
                  <div>
                    <label className="block font-semibold text-gray-800 mb-1">
                      Remarks
                    </label>
                    <input
                      type="text"
                      name="comment"
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add a comment"
                      value={comment || ""}
                      className="w-full bg-white px-4 py-2 rounded-md border border-gray-300"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 pt-2">
                <button
                  onClick={() => handleUpdateRequest("Rejected", leaveReq.id || 0)}
                  disabled={processingId === leaveReq.id}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full disabled:opacity-50"
                >
                  {processingId === leaveReq.id ? "Processing..." : "Reject"}
                </button>
                <button
                  onClick={() => handleUpdateRequest("Accepted", leaveReq.id || 0)}
                  disabled={processingId === leaveReq.id}
                  className="bg-[#001F4D] hover:bg-[#002a66] text-white px-6 py-2 rounded-full disabled:opacity-50"
                >
                  {processingId === leaveReq.id ? "Processing..." : "Accept"}
                </button>
              </div>
            </div>
          );
        })}
      {leaveRequests.length === 0 && (
        <div className="flex items-center justify-center h-screen">
          No leave requests available.
        </div>
      )}
    </div>
  );
}
