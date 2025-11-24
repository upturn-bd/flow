"use client";

import React, { useEffect } from "react";
import { extractFileNameFromStoragePath, extractFilenameFromUrl } from "@/lib/utils";
import { useClaimTypes } from "@/hooks/useConfigTypes";
import { useEmployeesContextContext } from "@/contexts";
import { useSettlementRequests } from "@/hooks/useSettlement";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  DollarSign, 
  Calendar, 
  User, 
  CheckCheck, 
  XCircle,
  Clock,
  MessageSquare,
  FormInput
} from "lucide-react";
import LoadingSection from "@/app/(home)/home/components/LoadingSection";

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
  comment?: string;
}

export default function SettlementHistoryPage() {
  const { employees } = useEmployeesContext();
  const { claimTypes, fetchClaimTypes } = useClaimTypes();
  const { 
    settlementRequests, 
    loading, 
    error, 
    fetchSettlementHistory 
  } = useSettlementRequests();

  useEffect(() => {
    fetchSettlementHistory();
  }, [fetchSettlementHistory]);

  useEffect(() => {
    
  }, [fetchEmployees]);

  useEffect(() => {
    fetchClaimTypes();
  }, [fetchClaimTypes]);

  return (
    <AnimatePresence mode="wait">
      {loading && (
        <LoadingSection 
          text="Loading settlement history..."
          icon={FormInput}
          color="blue"
          />
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
                {settlementRequests.map((settlement) => (
                  <motion.div
                    key={settlement.id}
                    initial={{ opacity: 1, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 1, y: -20 }}
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
                      
                      <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full
                        ${settlement.status === 'Approved' 
                          ? 'bg-green-100 text-green-800' 
                          : settlement.status === 'Rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {settlement.status === 'Approved' ? (
                          <CheckCheck size={12} />
                        ) : settlement.status === 'Rejected' ? (
                          <XCircle size={12} />
                        ) : (
                          <Clock size={12} />
                        )}
                        <span>{settlement.status}</span>
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
                    
                    {settlement.comment && (
                      <div className="mt-3 text-sm text-gray-700 bg-blue-50 p-3 rounded-md">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare size={14} />
                          <p className="font-medium">Feedback:</p>
                        </div>
                        <p>{settlement.comment}</p>
                      </div>
                    )}

                    {settlement.attachments && settlement.attachments.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Attachments:</p>
                        <div className="flex flex-wrap gap-2">
                          {settlement.attachments.map((attachment:string, idx:number) => (
                            <a
                              key={idx}
                              href={settlement.attachment_download_urls[idx]}
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
                  </motion.div>
                ))}
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
