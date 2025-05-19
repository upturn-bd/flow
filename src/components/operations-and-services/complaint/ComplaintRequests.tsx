"use client";

import { getCompanyId, getUserInfo } from "@/lib/api/company-info/employees"
import { createClient } from "@/lib/supabase/client";
import React, { useEffect, useState } from "react";
import { FaFilePdf } from "react-icons/fa";
import { extractFilenameFromUrl } from "@/lib/utils";
import { getEmployeesInfo } from "@/lib/api/admin-management/inventory";
import { ComplaintState } from "./ComplaintCreatePage";
import { useComplaintTypes } from "@/hooks/useComplaints";

export default function ComplaintRequestsPage() {
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
    const supabase = createClient();
    const user = await getUserInfo();
    const company_id = await getCompanyId();
    try {
      const { data, error } = await supabase
        .from("complaint_records")
        .select("*")
        .eq("company_id", company_id)
        .eq("requested_to", user.id)
        .eq("status", "Submitted");

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

  async function updateSettlementRequest(action: string, id: number) {
    const supabase = createClient();
    const user = await getUserInfo();
    const company_id = await getCompanyId();
    try {
      const { data, error } = await supabase
        .from("complaint_records")
        .update({
          status: action,
          resolved_by_id: user.id,
          comment: comment,
        })
        .eq("company_id", company_id)
        .eq("id", id);
      if (error) {
        setError("Failed to fetch complaint requests");
        throw error;
      }
      alert("complaint request updated successfully");
      setComment("");
      fetchComplaintRequests();
    } catch {
      setError("Failed to fetch complaint requests");
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
      <h1 className="text-xl font-bold text-[#003366]">Complaint Requests</h1>

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

              <div className="flex-1 space-y-4">
                {/* Comment */}
                <div>
                  <label className="block font-semibold text-gray-800 mb-1">
                    Comment
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

                {/* Attachment */}
                {req.attachments?.length > 0 && (
                  <div className="space-y-2">
                    <label className="block font-semibold text-gray-800 mb-1">
                      Attachment
                    </label>
                    {req.attachments.map((attachment) => (
                      <div
                        key={attachment}
                        onClick={() => {
                          window.open(attachment, "_blank");
                        }}
                        className="flex items-center bg-white border border-gray-300 rounded-md px-4 py-2 gap-3 max-w-xs cursor-pointer hover:bg-gray-50 transition duration-200"
                      >
                        <FaFilePdf className="text-red-600 text-xl" />
                        <div className="text-sm">
                          <p>{extractFilenameFromUrl(attachment)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-2">
              <button
                onClick={() => updateSettlementRequest("Resolved", req.id)}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full"
              >
                Reject
              </button>
              <button
                onClick={() => updateSettlementRequest("Resolved", req.id)}
                className="bg-[#001F4D] hover:bg-[#002a66] text-white px-6 py-2 rounded-full"
              >
                Accept
              </button>
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
