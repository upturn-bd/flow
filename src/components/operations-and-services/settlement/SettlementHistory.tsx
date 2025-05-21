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
  CheckCheck, 
  XCircle,
  Clock 
} from "lucide-react";
import { SettlementState } from "./SettlementCreatePage";
import { fetchSettlementHistory } from "@/lib/api/operations-and-services/settlement";

export default function SettlementHistoryPage() {
  const { employees, fetchEmployees } = useEmployees();
  const { claimTypes, fetchClaimTypes } = useClaimTypes();
  const { 
    settlementRequests, 
    loading, 
    error, 
    fetchSettlementRequests 
  } = useSettlementRequests();

  useEffect(() => {
    // For history, we fetch with any status that is not Pending
    fetchSettlementRequests("Approved").then(() => {
      // This is a hacky approach since we want both approved and rejected
      // A better solution would be to modify the hook to accept an array of statuses
      fetchSettlementRequests("Rejected");
    });
  }, [fetchSettlementRequests]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    fetchClaimTypes();
  }, [fetchClaimTypes]);

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
          <p className="text-gray-500">Loading settlement history...</p>
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
          <h1 className="text-xl font-bold text-blue-700">Settlement History</h1>

          {settlementRequests.length > 0 ? (
            <div className="space-y-4">
              <AnimatePresence>
                {settlementRequests.map((req) => (
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
                        <DollarSign size={18} className="text-green-600 mt-1 flex-shrink-0" />
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {claimTypes.find(type => type.id === req.settlement_type_id)?.settlement_item || "Unknown"}
                          </h3>
                          <p className="text-sm text-gray-600 font-medium">
                            Amount: {req.amount}
                          </p>
                        </div>
                      </div>
                      
                      <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full
                        ${req.status === 'Approved' 
                          ? 'bg-green-100 text-green-800' 
                          : req.status === 'Rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {req.status === 'Approved' ? (
                          <CheckCheck size={12} />
                        ) : req.status === 'Rejected' ? (
                          <XCircle size={12} />
                        ) : (
                          <Clock size={12} />
                        )}
                        <span>{req.status}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 mt-3">
                      {req.event_date && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Calendar size={14} />
                          <span>{req.event_date}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <User size={14} />
                        <span>Requested by: <span className="font-medium">
                          {employees.find(employee => employee.id === req.claimant_id)?.name || "Unknown"}
                        </span></span>
                      </div>
                    </div>
                    
                    {req.description && (
                      <div className="mt-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                        <p className="font-medium mb-1">Description:</p>
                        <p>{req.description}</p>
                      </div>
                    )}
                    
                    {req.comment && (
                      <div className="mt-3 text-sm text-gray-700 bg-blue-50 p-3 rounded-md">
                        <p className="font-medium mb-1">Feedback:</p>
                        <p>{req.comment}</p>
                      </div>
                    )}
                    
                    {req.in_advance && (
                      <div className="bg-blue-50 text-blue-700 rounded-md px-3 py-2 text-sm inline-flex items-center">
                        <Clock size={14} className="mr-2" />
                        <span>In Advance Request</span>
                      </div>
                    )}

                    {req.attachments && req.attachments.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Attachments:</p>
                        <div className="flex flex-wrap gap-2">
                          {req.attachments.map((attachment, idx) => (
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
              <h3 className="text-lg font-medium text-gray-900">No settlement history</h3>
              <p className="mt-1 text-gray-500">Completed settlement requests will appear here</p>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
