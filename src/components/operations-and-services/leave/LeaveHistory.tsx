"use client";

import { getCompanyId, getUserInfo } from "@/lib/auth/getUser";
import { supabase } from "@/lib/supabase/client";
import React, { useEffect, useState } from "react";
import { LeaveState } from "./LeaveCreatePage";
import { fetchLeaveHistory } from "@/lib/api/operations-and-services/attendance/leave";
import { motion, AnimatePresence } from "framer-motion";
import { useEmployees } from "@/hooks/useEmployees";
import { useLeaveTypes } from "@/hooks/useConfigTypes";

export default function LeaveHistoryPage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveState[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { leaveTypes, fetchLeaveTypes } = useLeaveTypes();
  const [comment, setComment] = useState<string>("");
  const { employees, fetchEmployees } = useEmployees();

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
        .neq("status", "Pending");

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

  useEffect(() => {
    fetchComplaintRequests();
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

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
      <h1 className="text-xl font-bold text-[#003366]">Leave History</h1>

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
