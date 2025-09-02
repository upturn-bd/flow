"use client";

import { useRequisitionInventories } from "@/hooks/useConfigTypes";
import { useRequisitionTypes } from "@/hooks/useConfigTypes";
import React, { useEffect, useState } from "react";
import { extractFilenameFromUrl } from "@/lib/utils";
import { useEmployees } from "@/hooks/useEmployees";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, 
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
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/Card";
import { InfoRow } from "@/components/ui/Card";
import LoadingSection from "@/app/(home)/home/components/LoadingSection";
import { Van } from "@phosphor-icons/react";

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
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-blue-700">Requisition Requests</h1>

      {loading && <LoadingSection 
          text="Loading requisition requests..."
          icon={Van}
          color="blue"
          />}
      
      {error && !loading && (
        <EmptyState 
          icon={<PackageOpen className="h-12 w-12" />}
          title="Error loading requests"
          description={error}
        />
      )}
      
      {!loading && !error && (
        <>
          {requisitionRequests.length > 0 ? (
            <div className="space-y-4">
              <AnimatePresence>
                {requisitionRequests.map((req) => (
                    <Card key={req.id}>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-3">
                            <PackageOpen className="text-blue-600 mt-1" size={20} />
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {requisitionTypes.find(type => type.id === req.requisition_category_id)?.name || "Unknown"}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {requisitionInventories.find(item => item.id === req.item_id)?.name || "Unknown"}
                              </p>
                            </div>
                          </div>
                          
                          <StatusBadge status="pending" size="sm" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <InfoRow 
                            icon={<TagIcon size={16} />}
                            label="Quantity"
                            value={req.quantity.toString()}
                          />
                          
                          {req.date && (
                            <InfoRow 
                              icon={<Calendar size={16} />}
                              label="Date"
                              value={req.date}
                            />
                          )}
                          
                          {(req.from_time || req.to_time) && (
                            <InfoRow 
                              icon={<Clock size={16} />}
                              label="Time"
                              value={`${req.from_time || 'N/A'} - ${req.to_time || 'N/A'}`}
                            />
                          )}
                        </div>
                        
                        <InfoRow 
                          icon={<User size={16} />}
                          label="Requested by"
                          value={employees.find(employee => employee.id === String(req.employee_id))?.name || "Unknown"}
                        />
                        
                        {req.description && (
                          <div className="bg-gray-50 p-3 rounded-md">
                            <p className="font-medium text-sm text-gray-700 mb-1">Description:</p>
                            <p className="text-sm text-gray-600">{req.description}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                        <div className="flex flex-wrap justify-end gap-4 pt-2 border-t border-gray-100">
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
                      </CardContent>
                    </Card>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <EmptyState 
              icon={<PackageOpen className="h-12 w-12" />}
              title="No pending requisition requests"
              description="When users submit requisition requests, they'll appear here"
            />
          )}
        </>
      )}
    </div>
  );
}
