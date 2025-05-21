"use client";

import React, { useEffect, useState } from "react";
import { ComplaintState } from "./ComplaintCreatePage";
import { useEmployees } from "@/hooks/useEmployees";
import { useComplaints } from "@/hooks/useRequests";
import { useComplaintTypes } from "@/hooks/useConfigTypes";
import { extractFilenameFromUrl } from "@/lib/utils";
import { FaFilePdf } from "react-icons/fa";

export default function ComplaintHistoryPage() {
  const { employees, fetchEmployees } = useEmployees();
  const { complaintTypes, fetchComplaintTypes } = useComplaintTypes();
  const { 
    complaints, 
    loading, 
    error, 
    fetchComplaints 
  } = useComplaints();

  useEffect(() => {
    fetchComplaints("Resolved");
  }, [fetchComplaints]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

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

      {complaints.length > 0 &&
        complaints.map((req) => (
          <div
            key={req.id}
            className="bg-gray-100 rounded-xl p-6 space-y-4 shadow-sm"
          >
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div className="flex-1 space-y-2 text-sm text-gray-800">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 font-medium rounded">
                    {req.status}
                  </span>
                </div>
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
                {req.comment && (
                  <p>
                    <span className="font-bold">Comment:</span> {req.comment}
                  </p>
                )}
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
            </div>
          </div>
        ))}
      {complaints.length === 0 && (
        <div className="flex items-center justify-center h-screen">
          No complaint history available.
        </div>
      )}
    </div>
  );
}
