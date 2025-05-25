"use client";

import { useRequisitionInventories } from "@/hooks/useConfigTypes";
import { useRequisitionTypes } from "@/hooks/useConfigTypes";
import React, { useEffect, useState } from "react";
import { extractFilenameFromUrl } from "@/lib/utils";
import { useEmployees } from "@/hooks/useEmployees";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, 
  XCircle, 
  PackageOpen, 
  Calendar, 
  Clock, 
  User, 
  MessageSquare,
  TagIcon, 
  FileText,
  Check,
  X
} from "lucide-react";
import { toast } from "sonner";
import { useRequisitionRequests } from "@/hooks/useRequisition";

export default function RequisitionRequestsPage() {
  const [comment, setComment] = useState<string>("");
  const { employees, fetchEmployees } = useEmployees();
  const { requisitionTypes, fetchRequisitionTypes } = useRequisitionTypes();
  const { requisitionInventories, fetchRequisitionInventories } = useRequisitionInventories();
  const { 
    requisitionRequests, 
    loading, 
    error, 
    processingId, 
    fetchRequisitionRequests, 
    updateRequisitionRequest 
  } = useRequisitionRequests();

  useEffect(() => {
    fetchRequisitionRequests("Pending");
  }, [fetchRequisitionRequests]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    fetchRequisitionTypes();
    fetchRequisitionInventories();
  }, [fetchRequisitionTypes, fetchRequisitionInventories]);

  const handleUpdateRequest = async (action: 'Approved' | 'Rejected', id: number) => {
    const success = await updateRequisitionRequest(action, id, comment);
    if (success) {
      toast.success(`Request ${action.toLowerCase()} successfully`);
      setComment("");
    }
  };

  return (
    <AnimatePresence mode="wait">
      {loading && (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col items-center justify-center py-16"
        >
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
          <p className="text-gray-500">Loading requisition requests...</p>
        </motion.div>
      )}
      
      {error && !loading && (
        <motion.div
          key="error"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col items-center justify-center py-16"
        >
          <XCircle className="h-12 w-12 text-red-500 mb-2" />
          <p className="text-red-500 font-medium">{error}</p>
        </motion.div>
      )}
      
      {!loading && !error && (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="p-6 max-w-5xl mx-auto space-y-6"
        >
          <h1 className="text-xl font-bold text-blue-700">Requisition Requests</h1>

          {requisitionRequests.length > 0 ? (
            <div className="space-y-4">
              <AnimatePresence>
                {requisitionRequests.map((req) => (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-2">
                        <PackageOpen className="text-blue-600 mt-1" size={18} />
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {requisitionTypes.find(type => type.id === req.requisition_category_id)?.name || "Unknown"}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {requisitionInventories.find(item => item.id === req.item_id)?.name || "Unknown"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                        <Clock size={12} />
                        <span>Pending</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <TagIcon size={14} />
                        <span>Quantity: <span className="font-medium">{req.quantity}</span></span>
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
                          <span>{req.from_time || 'N/A'} - {req.to_time || 'N/A'}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <User size={14} />
                      <span>Requested by: <span className="font-medium">
                        {employees.find(employee => employee.id === String(req.employee_id))?.name || "Unknown"}
                      </span></span>
                    </div>
                    
                    {req.description && (
                      <div className="mt-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                        <p className="font-medium mb-1">Description:</p>
                        <p>{req.description}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
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

                      {req.attachments && req.attachments.length > 0 && (
                        <div className="space-y-2">
                          <p className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <FileText size={14} />
                            <span>Attachments</span>
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {req.attachments.map((attachment, index) => (
                              <a
                                key={index}
                                href={attachment}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700 text-xs px-2 py-1 rounded"
                              >
                                <FileText size={12} />
                                <span>{extractFilenameFromUrl(attachment)}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap justify-end gap-4 pt-2">
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleUpdateRequest("Rejected", req.id)}
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
                        onClick={() => handleUpdateRequest("Approved", req.id)}
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
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="bg-gray-100 rounded-full p-4 mb-4">
                <PackageOpen className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No pending requisition requests</h3>
              <p className="mt-1 text-gray-500">When users submit requisition requests, they'll appear here</p>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
