"use client";

import { getCompanyId, getUserInfo } from "@/lib/auth/getUser";
import { supabase } from "@/lib/supabase/client";
import React, { useEffect, useState } from "react";
import { getEmployeesInfo } from "@/lib/api/admin-management/inventory";
import { LeaveState } from "./LeaveCreatePage";
import { useLeaveTypes } from "@/hooks/useLeaveManagement";

export default function LeaveRequestsPage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveState[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { leaveTypes, fetchLeaveTypes } = useLeaveTypes();
  const [comment, setComment] = useState<string>("");
  const [employees, setEmployees] = useState<any[]>([]);

  async function fetchComplaintRequests() {
    setLoading(true);
    
    const user = await getUserInfo();
    const company_id = await getCompanyId();
    try {
      const { data, error } = await supabase
        .from("leave_records")
        .select("*")
        .eq("company_id", company_id)
        .eq("requested_to", user.id)
        .eq("status", "Pending");

      if (error) {
        setError("Failed to fetch leave requests");
        throw error;
      }

      setLeaveRequests(data);
    } catch (error) {
      setError("Failed to fetch leave requests");
    } finally {
      setLoading(false);
    }
  }

  async function updateSettlementRequest(action: string, id: number) {
    
    const user = await getUserInfo();
    const company_id = await getCompanyId();
    try {
      const { data, error } = await supabase
        .from("leave_records")
        .update({
          status: action,
          approved_by_id: user.id,
          remarks: comment,
        })
        .eq("company_id", company_id)
        .eq("id", id);
      if (error) {
        setError("Failed to fetch leave requests");
        throw error;
      }
      alert("leave request updated successfully");
      setComment("");
      fetchComplaintRequests();
    } catch {
      setError("Failed to fetch leave requests");
    }
  }

  useEffect(() => {
    fetchComplaintRequests();
  }, []);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await getEmployeesInfo();
        setEmployees(response.data);
      } catch (error) {
        setEmployees([]);
        console.error("Error fetching employees:", error);
      }
    };

    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchLeaveTypes();
  }, [fetchLeaveTypes]);

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
        leaveRequests.map((req) => (
          <div
            key={req.id}
            className="bg-gray-100 rounded-xl p-6 space-y-4 shadow-sm"
          >
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div className="flex-1 space-y-2 text-sm text-gray-800">
                <p>
                  <span className="font-bold">Category:</span>{" "}
                  {leaveTypes.find((type) => type.id === req.type_id)?.name}
                </p>
                <p>
                  <span className="font-bold">Requested By:</span>{" "}
                  {
                    employees.find(
                      (employee) => employee.id === req.employee_id
                    )?.name
                  }
                </p>
                <p>
                  <span className="font-bold">Description:</span>{" "}
                  {req.description}
                </p>
                <p>
                  <span className="font-bold">From:</span> {req.start_date}
                </p>
                <p>
                  <span className="font-bold">To:</span> {req.end_date}
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
                onClick={() => updateSettlementRequest("Rejected", req.id)}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full"
              >
                Reject
              </button>
              <button
                onClick={() => updateSettlementRequest("Accepted", req.id)}
                className="bg-[#001F4D] hover:bg-[#002a66] text-white px-6 py-2 rounded-full"
              >
                Accept
              </button>
            </div>
          </div>
        ))}
      {leaveRequests.length === 0 && (
        <div className="flex items-center justify-center h-screen">
          No leave requests available.
        </div>
      )}
    </div>
  );
}
