"use client";

import React, { useEffect, useState } from "react";
import { extractFilenameFromUrl } from "@/lib/utils";
import { useClaimTypes } from "@/hooks/useConfigTypes";
import { useEmployees } from "@/hooks/useEmployees";
import { useSettlementRequests } from "@/hooks/useSettlement";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Loader2, 
  DollarSign, 
  Calendar, 
  User, 
  Clock, 
  Check, 
  X,
  MessageSquare,
  XCircle 
} from "lucide-react";
import { toast } from "sonner";

// Define the structure of a settlement request
interface SettlementRequest {
  id: number;
  settlement_type_id: number;
  amount: number;
  event_date?: string;
  claimant_id: string;
  description?: string;
  in_advance?: boolean;
  attachments?: string[];
  status: string;
}

export default function SettlementRequestsPage() {
  const [comment, setComment] = useState<string>("");
  const { employees, fetchEmployees } = useEmployees();
  const { claimTypes, fetchClaimTypes } = useClaimTypes();
  const { 
    settlementRequests, 
    loading, 
    error, 
    processingId, 
    fetchSettlementRequests, 
    updateSettlementRequest 
  } = useSettlementRequests();

  useEffect(() => {
    fetchSettlementRequests();
  }, [fetchSettlementRequests]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    fetchClaimTypes();
  }, [fetchClaimTypes]);

  const handleUpdateRequest = async (action: string, id: number) => {
    const success = await updateSettlementRequest(action, id, comment);
    if (success) {
      toast.success(`Settlement request ${action.toLowerCase()} successfully`);
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
          <p className="text-gray-500">Loading settlement requests...</p>
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
          <h1 className="text-xl font-bold text-blue-700">Settlement Requests</h1>

          {settlementRequests.length > 0 ? (
            <div className="space-y-4">
              <AnimatePresence>
                {settlementRequests.map((settlement) => (
                  <motion.div
                    key={settlement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-2">
                        <DollarSign size={18} className="text-green-600 mt-1 flex-shrink-0" />
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {claimTypes.find(type => type.id === settlement.settlement_type_id)?.settlement_item || "Unknown"}
                          </h3>
                          <p className="text-sm text-gray-600 font-medium">
                            Amount: {settlement.amount} BDT
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                        <Clock size={12} />
                        <span>Pending</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                      {settlement.event_date && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Calendar size={14} />
                          <span>{settlement.event_date}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <User size={14} />
                        <span>Requested by: <span className="font-medium">
                          {employees.find(employee => employee.id === settlement.claimant_id)?.name || "Unknown"}
                        </span></span>
                      </div>

                      {settlement.in_advance && (
                        <div className="flex items-center gap-2 text-sm text-blue-700">
                          <Clock size={14} />
                          <span>In Advance Request</span>
                        </div>
                      )}
                    </div>
                    
                    {settlement.description && (
                      <div className="mt-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                        <p className="font-medium mb-1">Description:</p>
                        <p>{settlement.description}</p>
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

                      {settlement.attachments && settlement.attachments.length > 0 && (
                        <div className="space-y-2">
                          <p className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <FileText size={14} />
                            <span>Attachments</span>
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {settlement.attachments.map((attachment: string, idx: number) => (
                              <a
                                key={idx}
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
                        onClick={() => handleUpdateRequest("Rejected", settlement.id)}
                        disabled={processingId === settlement.id}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {processingId === settlement.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <X size={16} />
                        )}
                        <span>Reject</span>
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleUpdateRequest("Approved", settlement.id)}
                        disabled={processingId === settlement.id}
                        className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {processingId === settlement.id ? (
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
                <DollarSign className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No pending settlement requests</h3>
              <p className="mt-1 text-gray-500">When users submit settlement requests, they'll appear here</p>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
