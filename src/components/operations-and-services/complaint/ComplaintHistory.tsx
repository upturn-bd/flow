"use client";

import React, { useEffect, useState } from "react";
import { ComplaintState } from "./ComplaintCreatePage";
import { useEmployees } from "@/hooks/useEmployees";
import { useComplaints } from "@/hooks/useRequests";
import { useComplaintTypes } from "@/hooks/useConfigTypes";
import { extractFilenameFromUrl } from "@/lib/utils";
import { FaFilePdf } from "react-icons/fa";

// Add this interface
interface ComplaintRequest {
  id: number;
  status: string;
  complaint_type_id: number;
  anonymous: boolean;
  complainer_id: string;
  against_whom: string;
  description: string;
  comment?: string;
  attachments?: string[];
}

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
        complaints.map((req) => {
          const complaint = req as unknown as ComplaintRequest;
          return (
            <div
              key={complaint.id}
              className="bg-gray-100 rounded-xl p-6 space-y-4 shadow-sm"
            >
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div className="flex-1 space-y-2 text-sm text-gray-800">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 font-medium rounded">
                      {complaint.status}
                    </span>
                  </div>
                  <p>
                    <span className="font-bold">Category:</span>{" "}
                    {complaintTypes.find((type) => type.id === complaint.complaint_type_id)?.name}
                  </p>
                  <p>
                    <span className="font-bold">Requested By:</span>{" "}
                    {
                      complaint.anonymous ? "Anonymous" :
                      employees.find(
                        (employee) => employee.id === complaint.complainer_id
                      )?.name
                    }
                  </p>
                  <p>
                    <span className="font-bold">Against:</span>{" "}
                    {
                      employees.find(
                        (employee) => employee.id === complaint.against_whom
                      )?.name
                    }
                  </p>
                  <p>
                    <span className="font-bold">Description:</span>{" "}
                    {complaint.description}
                  </p>
                  {complaint.comment && (
                    <p>
                      <span className="font-bold">Comment:</span> {complaint.comment}
                    </p>
                  )}
                  {complaint.attachments && complaint.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {complaint.attachments.map((url, idx) => (
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
          );
        })}
      {complaints.length === 0 && (
        <div className="flex items-center justify-center h-screen">
          No complaint history available.
        </div>
      )}
    </div>
  );
}
