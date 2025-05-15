"use client";

import { useRequisitionInventories } from "@/hooks/useInventory";
import { useRequisitionTypes } from "@/hooks/useRequisitionTypes";
import { getCompanyId, getUserInfo } from "@/lib/auth/getUser";
import { createClient } from "@/lib/supabase/client";
import React, { useEffect, useState } from "react";
import { FaFilePdf } from "react-icons/fa";
import { RequisitionState } from "./RequisitionCreatePage";
import { extractFilenameFromUrl } from "@/lib/utils";
import { getEmployeesInfo } from "@/lib/api/admin-management/inventory";

export default function RequisitionRequestsPage() {
  const [requisitionRequests, setRequisitionRequests] = useState<
    RequisitionState[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { requisitionTypes, fetchRequisitionTypes } = useRequisitionTypes();
  const { requisitionInventories, fetchRequisitionInventories } =
    useRequisitionInventories();
  const [comment, setComment] = useState<string>("");
  const [employees, setEmployees] = useState<any[]>([]);

  async function fetchRequisitionRequests() {
    setLoading(true);
    const supabase = createClient();
    const user = await getUserInfo();
    const company_id = await getCompanyId();
    try {
      const { data, error } = await supabase
        .from("requisition_records")
        .select("*")
        .eq("company_id", company_id)
        .eq("asset_owner", user.id)
        .eq("status", "Pending");

      if (error) {
        setError("Failed to fetch requisition requests");
        throw error;
      }

      setRequisitionRequests(data);
    } catch (error) {
      setError("Failed to fetch requisition requests");
    } finally {
      setLoading(false);
    }
  }

  async function updateRequisitionRequest(action: string, id: number) {
    const supabase = createClient();
    const user = await getUserInfo();
    const company_id = await getCompanyId();
    try {
      const { data, error } = await supabase
        .from("requisition_records")
        .update({
          status: action,
          approved_by_id: user.id,
          comment: comment,
        })
        .eq("company_id", company_id)
        .eq("id", id);
      if (error) {
        setError("Failed to fetch requisition requests");
        throw error;
      }
      alert("Requisition request updated successfully");
      setComment("");
      fetchRequisitionRequests();
    } catch {
      setError("Failed to fetch requisition requests");
    }
  }

  useEffect(() => {
    fetchRequisitionRequests();
  }, []);

  useEffect(() => {
      const fetchEmployees = async () => {
        try {
          const response = await getEmployeesInfo();
          setEmployees(response.data);
        } catch (error) {
          setEmployees([]);
          console.error("Error fetching asset owners:", error);
        }
      };
  
      fetchEmployees();
    }, []);

  useEffect(() => {
    fetchRequisitionTypes();
    fetchRequisitionInventories();
  }, [fetchRequisitionTypes, fetchRequisitionInventories]);
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
      <h1 className="text-xl font-bold text-[#003366]">Requisition Requests</h1>

      {requisitionRequests.length > 0 &&
        requisitionRequests.map((req) => (
          <div
            key={req.id}
            className="bg-gray-100 rounded-xl p-6 space-y-4 shadow-sm"
          >
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div className="flex-1 space-y-2 text-sm text-gray-800">
                <p>
                  <span className="font-bold">Category:</span>{" "}
                  {
                    requisitionTypes.find(
                      (type) => type.id === req.requisition_category_id
                    )?.name
                  }
                </p>
                <p>
                  <span className="font-bold">Item:</span>{" "}
                  {
                    requisitionInventories.find(
                      (item) => item.id === req.item_id
                    )?.name
                  }
                </p>
                <p>
                  <span className="font-bold">Quantity:</span> {req.quantity}
                </p>
                {req.date && (
                  <p>
                    <span className="font-bold">Date:</span> {req.date}
                  </p>
                )}
                {req.from_time && (
                  <p>
                    <span className="font-bold">From:</span> {req.from_time}
                  </p>
                )}
                {req.to_time && (
                  <p>
                    <span className="font-bold">To:</span> {req.to_time}
                  </p>
                )}
                <p>
                  <span className="font-bold">Requested by:</span> {employees.find((employee) => employee.id === req.employee_id)?.name}
                </p>
                <p>
                  <span className="font-bold">Description:</span> {req.description}
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
                    value={req.comment || ""}
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
              <button onClick={()=> updateRequisitionRequest("Discarded", req.id)} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full">
                Reject
              </button>
              <button onClick={()=> updateRequisitionRequest("Approved", req.id)} className="bg-[#001F4D] hover:bg-[#002a66] text-white px-6 py-2 rounded-full">
                Accept
              </button>
            </div>
          </div>
        ))}
      {requisitionRequests.length === 0 && (
        <div className="flex items-center justify-center h-screen">
          No requisition requests available.
        </div>
      )}
    </div>
  );
}
