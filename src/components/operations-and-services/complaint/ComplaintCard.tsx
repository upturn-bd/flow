"use client";

import React, { useState } from "react";
import {
  Flag,
  CheckCheck,
  XCircle,
  Clock,
  User,
  MessageSquare,
  FileText,
  X,
  Check
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { ComplaintRecord, ComplaintsType } from "@/lib/types";

interface Employee {
  id: string;
  name: string;
}

interface ComplaintCardProps {
  complaint: ComplaintRecord;
  employees: Employee[];
  complaintTypes: ComplaintsType[];
  extractFileNameFromStoragePath: (path: string) => string;
  mode?: "history" | "request";
  onAccept?: () => void;
  onReject?: () => void;
  isProcessing?: boolean;
}

export const ComplaintCard: React.FC<ComplaintCardProps> = ({
  complaint,
  employees,
  complaintTypes,
  extractFileNameFromStoragePath,
  mode = "history",
  onAccept,
  onReject,
  isProcessing = false,
}) => {
  const [comment, setComment] = useState("");

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Accepted":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const complainer = employees.find(e => e.id === complaint.complainer_id);
  const against = employees.find(e => e.id === complaint.against_whom);
  const type = complaintTypes.find(t => t.id === complaint.complaint_type_id);

  return (
    <motion.div
      key={complaint.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 shadow-sm hover:shadow-md transition-all"
    >
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-2">
          <Flag className="text-blue-600 mt-1" size={18} />
          <div>
            <h3 className="font-medium text-gray-900">
              {type?.name || "Unknown Complaint Type"}
            </h3>
            <p className="text-sm text-gray-600">
              {complaint.anonymous ? "Anonymous Complaint" : "Named Complaint"}
            </p>
          </div>
        </div>

        <div
          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${getStatusStyle(
            complaint.status
          )}`}
        >
          {complaint.status === "Accepted" ? (
            <CheckCheck size={12} />
          ) : complaint.status === "Rejected" ? (
            <XCircle size={12} />
          ) : (
            <Clock size={12} />
          )}
          <span>{complaint.status}</span>
        </div>
      </div>

      {/* Complaint Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <User size={14} />
          <span>
            Requested by:{" "}
            <span className="font-medium">
              {complaint.anonymous ? "Anonymous" : complainer?.name || "Unknown"}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-700">
          <User size={14} />
          <span>
            Against: <span className="font-medium">{against?.name || "Unknown"}</span>
          </span>
        </div>
      </div>

      {/* Description */}
      {complaint.description && (
        <div className="mt-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
          <p className="font-medium mb-1">Description:</p>
          <p>{complaint.description}</p>
        </div>
      )}

      {/* Feedback/Comment (history only) */}
      {mode === "history" && complaint.comment && (
        <div className="mt-3 text-sm text-gray-700 bg-blue-50 p-3 rounded-md">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare size={14} />
            <p className="font-medium">Feedback:</p>
          </div>
          <p>{complaint.comment}</p>
        </div>
      )}

      {/* Attachments */}
      {complaint.attachments && complaint.attachments.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-gray-500 mb-1">Attachments:</p>
          <div className="flex flex-wrap gap-2">
            {complaint.attachments.map((attachment, idx) => (
              <a
                key={idx}
                href={complaint.attachment_download_urls?.[idx]}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700 text-xs px-2 py-1 rounded"
              >
                <FileText size={12} />
                <span>{extractFileNameFromStoragePath(attachment)}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Request Mode: Comment input + buttons */}
      {mode === "request" && (
        <>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MessageSquare size={16} className="inline mr-2" />
                Add Comment
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add your feedback here..."
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReject?.()}
                disabled={isProcessing}
                className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
              >
                <X size={14} /> Reject
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onAccept?.()}
                disabled={isProcessing}
                className="flex items-center gap-2"
                isLoading={isProcessing}
              >
                <Check size={14} /> Accept
              </Button>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};
