"use client";

import React, { useState } from "react";
import {
  PackageOpen,
  CheckCheck,
  XCircle,
  Clock,
  TagIcon,
  Calendar,
  User,
  FileText,
  MessageSquare,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { motion } from "framer-motion";

import { RequisitionType, RequisitionInventory } from "@/lib/types";


interface Employee {
  id: string;
  name: string;
}

export interface RequisitionCardProps {
  req: any;
  requisitionTypes: RequisitionType[];
  requisitionInventories: RequisitionInventory[];
  employees: Employee[];
  extractFileNameFromStoragePath: (path: string) => string;
  mode?: "history" | "request";
  isGlobal?: boolean;
  handleUpdateRequest?: (
    status: string,
    reqId: string,
    employeeId: string,
    comment?: string
  ) => void;
  processingId?: string | null;
  canApprove?: boolean
}

export const RequisitionCard: React.FC<RequisitionCardProps> = ({
  req,
  requisitionTypes,
  requisitionInventories,
  employees,
  extractFileNameFromStoragePath,
  mode = "history",
  isGlobal = false,
  handleUpdateRequest,
  processingId,
  canApprove = true
}) => {
  const [comment, setComment] = useState("");

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <motion.div
      key={req.id}
      initial={{ opacity: 1, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 1, y: -20 }}
      transition={{ duration: 0.2 }}
      className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 shadow-sm hover:shadow-md transition-all"
    >
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-3">
          <PackageOpen className="text-blue-600 mt-1" size={20} />
          <div>
            <h3 className="font-semibold text-gray-900">
              {requisitionTypes.find(
                (type) => type.id === req.requisition_category_id
              )?.name || "Unknown"}
            </h3>
            <p className="text-sm text-gray-600">
              {requisitionInventories.find((item) => item.id === req.item_id)
                ?.name || "Unknown"}
            </p>
          </div>
        </div>

        {mode === "history" ? (
          <div
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${getStatusStyle(
              req.status
            )}`}
          >
            {req.status === "Approved" ? (
              <CheckCheck size={12} />
            ) : req.status === "Rejected" ? (
              <XCircle size={12} />
            ) : (
              <Clock size={12} />
            )}
            <span>{req.status}</span>
          </div>
        ) : (
          <div
            className={`flex items-center gap-2 text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800`}
          >
            <Clock size={12} />
            <span>Pending</span>
          </div>
        )}
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <TagIcon size={14} />
          <span>
            Quantity: <span className="font-medium">{req.quantity}</span>
          </span>
        </div>

        {req.date && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Calendar size={14} />
            <span>{req.date}</span>
          </div>
        )}

        {(req.from_time || req.to_time) && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Clock size={14} />
            <span>
              {req.from_time || "N/A"} - {req.to_time || "N/A"}
            </span>
          </div>
        )}
      </div>

      {/* Requested By */}
      <div className="mt-3 flex items-center gap-2 text-sm text-gray-700">
        <User size={14} />
        <span>
          Requested by:{" "}
          <span className="font-medium">
            {employees.find((e) => e.id === String(req.employee_id))?.name ||
              "Unknown"}
          </span>
        </span>
      </div>

      {/* Description */}
      {req.description && (
        <div className="mt-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
          <p className="font-medium mb-1">Description:</p>
          <p>{req.description}</p>
        </div>
      )}

      {/* Attachments */}
      {req.attachments && req.attachments.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-gray-500 mb-1">Attachments:</p>
          <div className="flex flex-wrap gap-2">
            {req.attachments.map((attachment: string, index: number) => (
              <a
                key={index}
                href={req.attachment_download_urls?.[index]}
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

      {/* Mode: request only */}
      {mode === "request" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* Comment input */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <MessageSquare size={14} />
                <span>Add Comment</span>
              </label>
              <input
                type="text"
                name="comment"
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add your feedback here..."
                value={comment}
                className="w-full px-4 py-2 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap justify-end gap-4 pt-4 border-t border-gray-100">
            {canApprove && (
              <>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() =>
                    handleUpdateRequest?.("Rejected", req.id, req.employee_id, comment)
                  }
                  disabled={processingId === req.id}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {processingId === req.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <X size={16} />
                  )}
                  <span>Reject</span>
                </motion.button>


                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() =>
                    handleUpdateRequest?.("Approved", req.id, req.employee_id, comment)
                  }
                  disabled={processingId === req.id}
                  className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {processingId === req.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}
                  <span>Approve</span>
                </motion.button>

              </>
            )}


          </div>
        </>
      )}
    </motion.div>
  );
};
