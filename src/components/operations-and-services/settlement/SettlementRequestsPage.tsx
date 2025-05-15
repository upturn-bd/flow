"use client";

import { getCompanyId, getUserInfo } from "@/lib/auth/getUser";
import { createClient } from "@/lib/supabase/client";
import React, { useEffect, useState } from "react";
import { FaFilePdf } from "react-icons/fa";
import { SettlementState } from "./SettlementCreatePage";
import { extractFilenameFromUrl } from "@/lib/utils";
import { getEmployeesInfo } from "@/lib/api/admin-management/inventory";
import { useClaimTypes } from "@/hooks/useClaimAndSettlement";

export default function SettlementRequestsPage() {
  const [settlementRequests, setSettlementRequests] = useState<
    SettlementState[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { claimTypes, fetchClaimTypes } = useClaimTypes();
  const [comment, setComment] = useState<string>("");
  const [employees, setEmployees] = useState<any[]>([]);

  async function fetchSettlementRequests() {
    setLoading(true);
    const supabase = createClient();
    const user = await getUserInfo();
    const company_id = await getCompanyId();
    try {
      const { data, error } = await supabase
        .from("settlement_records")
        .select("*")
        .eq("company_id", company_id)
        .eq("requested_to", user.id)
        .eq("status", "Pending");

      if (error) {
        setError("Failed to fetch settlement requests");
        throw error;
      }

      setSettlementRequests(data);
    } catch (error) {
      setError("Failed to fetch settlement requests");
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
        .from("settlement_records")
        .update({
          status: action,
          approved_by_id: user.id,
          comment: comment,
        })
        .eq("company_id", company_id)
        .eq("id", id);
      if (error) {
        setError("Failed to fetch settlement requests");
        throw error;
      }
      alert("settlement request updated successfully");
      setComment("");
      fetchSettlementRequests();
    } catch {
      setError("Failed to fetch settlement requests");
    }
  }

  useEffect(() => {
    fetchSettlementRequests();
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
    fetchClaimTypes();
  }, [fetchClaimTypes]);

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
      <h1 className="text-xl font-bold text-[#003366]">Settlement Requests</h1>

      {settlementRequests.length > 0 &&
        settlementRequests.map((req) => (
          <div
            key={req.id}
            className="bg-gray-100 rounded-xl p-6 space-y-4 shadow-sm"
          >
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div className="flex-1 space-y-2 text-sm text-gray-800">
                <p>
                  <span className="font-bold">Category:</span>{" "}
                  {
                    claimTypes.find(
                      (type) => type.id === req.settlement_type_id
                    ).settlement_item
                  }
                </p>
                <p>
                  <span className="font-bold">Amount:</span> {req.amount}
                </p>
                {req.date && (
                  <p>
                    <span className="font-bold">Date:</span> {req.event_date}
                  </p>
                )}
                <p>
                  <span className="font-bold">Requested by:</span>{" "}
                  {
                    employees.find(
                      (employee) => employee.id === req.claimant_id
                    )?.name
                  }
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
                onClick={() => updateSettlementRequest("Rejected", req.id)}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full"
              >
                Reject
              </button>
              <button
                onClick={() => updateSettlementRequest("Approved", req.id)}
                className="bg-[#001F4D] hover:bg-[#002a66] text-white px-6 py-2 rounded-full"
              >
                Accept
              </button>
            </div>
          </div>
        ))}
      {settlementRequests.length === 0 && (
        <div className="flex items-center justify-center h-screen">
          No settlement requests available.
        </div>
      )}
    </div>
  );
}
