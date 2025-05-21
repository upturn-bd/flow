"use client";

import React, { useEffect, useState } from "react";
import { FaFilePdf } from "react-icons/fa";
import { extractFilenameFromUrl } from "@/lib/utils";
import { useEmployees } from "@/hooks/useEmployees";
import { useComplaints } from "@/hooks/useRequests";
import { useComplaintTypes } from "@/hooks/useConfigTypes";

export default function ComplaintRequestsPage() {
  const [comment, setComment] = useState<string>("");
  const { employees, fetchEmployees } = useEmployees();
  const { complaintTypes, fetchComplaintTypes } = useComplaintTypes();
  const { 
    complaints, 
    loading, 
    error, 
    processingId, 
    fetchComplaints, 
    updateComplaint 
  } = useComplaints();

  useEffect(() => {
    fetchComplaints("Pending");
  }, [fetchComplaints]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    fetchComplaintTypes();
  }, [fetchComplaintTypes]);

  const handleUpdateRequest = async (action: string, id: number) => {
    await updateComplaint(action, id, comment);
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
      <h1 className="text-xl font-bold text-[#003366]">Complaint Requests</h1>

      {complaints.length > 0 &&
        complaints.map((req) => (
          <div
            key={req.id}
            className="bg-gray-100 rounded-xl p-6 space-y-4 shadow-sm"
          >
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div className="flex-1 space-y-2 text-sm text-gray-800">
                <p>
                  <span className="font-bold">Category:</span>{" "}
                  {complaintTypes.find((type) => type.id === req.complaint_type_id)?.name}
                </p>
                <p>
                  <span className="font-bold">Requested By:</span>{" "}
                  {
                    req.anonymous ? "Anonymous" :
                    employees.find(
                      (employee) => employee.id === req.complainer_id
                    )?.name
                  }
                </p>
                <p>
                  <span className="font-bold">Against:</span>{" "}
                  {
                    employees.find(
                      (employee) => employee.id === req.against_whom
                    )?.name
                  }
                </p>
                <p>
                  <span className="font-bold">Description:</span>{" "}
                  {req.description}
                </p>
                {req.attachments && req.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {req.attachments.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        <FaFilePdf className="text-red-500" />
                        <span className="text-xs">
                          {extractFilenameFromUrl(url)}
                        </span>
                      </a>
                    ))}
                  </div>
                )}
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
                onClick={() => handleUpdateRequest("Rejected", req.id || 0)}
                disabled={processingId === req.id}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full disabled:opacity-50"
              >
                {processingId === req.id ? "Processing..." : "Reject"}
              </button>
              <button
                onClick={() => handleUpdateRequest("Accepted", req.id || 0)}
                disabled={processingId === req.id}
                className="bg-[#001F4D] hover:bg-[#002a66] text-white px-6 py-2 rounded-full disabled:opacity-50"
              >
                {processingId === req.id ? "Processing..." : "Accept"}
              </button>
            </div>
          </div>
        ))}
      {complaints.length === 0 && (
        <div className="flex items-center justify-center h-screen">
          No complaint requests available.
        </div>
      )}
    </div>
  );
}
