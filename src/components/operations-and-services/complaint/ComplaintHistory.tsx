"use client";

import { getCompanyId, getUserInfo } from "@/lib/auth/getUser";
import { supabase } from "@/lib/supabase/client";
import React, { useEffect, useState } from "react";
import { getEmployeesInfo } from "@/lib/api/admin-management/inventory";
import { ComplaintState } from "./ComplaintCreatePage";
import { useComplaintTypes } from "@/hooks/useComplaints";

export default function ComplaintHistoryPage() {
  const [complaintRequests, setComplaintRequests] = useState<ComplaintState[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { complaintTypes, fetchComplaintTypes } = useComplaintTypes();
  const [comment, setComment] = useState<string>("");
  const [employees, setEmployees] = useState<any[]>([]);

  async function fetchComplaintRequests() {
    setLoading(true);
    
    const user = await getUserInfo();
    const company_id = await getCompanyId();
    try {
      const { data, error } = await supabase
        .from("complaint_records")
        .select("*")
        .eq("company_id", company_id)
        .eq("requested_to", user.id)
        .neq("status", "Submitted");

      if (error) {
        setError("Failed to fetch complaint requests");
        throw error;
      }

      setComplaintRequests(data);
    } catch (error) {
      setError("Failed to fetch complaint requests");
    } finally {
      setLoading(false);
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
    fetchComplaintTypes();
  }, [fetchComplaintTypes]);

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
      <h1 className="text-xl font-bold text-[#003366]">Complaint History</h1>

      {complaintRequests.length > 0 &&
        complaintRequests.map((req) => (
          <div
            key={req.id}
            className="bg-gray-100 rounded-xl p-6 space-y-4 shadow-sm"
          >
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div className="flex-1 space-y-2 text-sm text-gray-800">
                <p>
                  <span className="font-bold">Category:</span>{" "}
                  {
                    complaintTypes.find(
                      (type) => type.id === req.complaint_type_id
                    )?.name
                  }
                </p>
                <p>
                  <span className="font-bold">Complaint Against:</span>{" "}
                  {
                    employees.find(
                      (employee) => employee.id === req.against_whom
                    )?.name
                  }
                </p>
                <p>
                  <span className="font-bold">Complaint By:</span>{" "}
                  {req.anonymous
                    ? "Anonymous"
                    : employees.find(
                        (employee) => employee.id === req.complainer_id
                      )?.name}
                </p>
                <p>
                  <span className="font-bold">Description:</span>{" "}
                  {req.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      {complaintRequests.length === 0 && (
        <div className="flex items-center justify-center h-screen">
          No complaint requests available.
        </div>
      )}
    </div>
  );
}
