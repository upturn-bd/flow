"use client";

import { getCompanyId, getUserInfo } from "@/lib/auth/getUser";
import { createClient } from "@/lib/supabase/client";
import React, { useEffect, useState } from "react";
import { SettlementState } from "./SettlementCreatePage";
import { extractFilenameFromUrl } from "@/lib/utils";
import { getEmployeesInfo } from "@/lib/api/admin-management/inventory";
import { useClaimTypes } from "@/hooks/useClaimAndSettlement";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Loader2, DollarSign, Calendar, User, Clock, CheckCheck, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function SettlementHistoryPage() {
  const [settlementRequests, setSettlementRequests] = useState<
    SettlementState[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { claimTypes, fetchClaimTypes } = useClaimTypes();
  const [comment, setComment] = useState<string>("");
  const [employees, setEmployees] = useState<any[]>([]);

  async function fetchSettlementRequests() {
    setLoading(true);
    const supabase = createClient();
    const user = await getUserInfo();
    const company_id = await getCompanyId();
    try {
      const { data, error } = await supabase
        .from("settlement_records")
        .select("*")
        .eq("company_id", company_id)
        .eq("requested_to", user.id)
        .neq("status", "Pending");

      if (error) {
        setError("Failed to fetch settlement requests");
        toast.error("Failed to fetch settlement requests");
        throw error;
      }

      setSettlementRequests(data);
    } catch (error) {
      setError("Failed to fetch settlement requests");
      toast.error("Failed to fetch settlement requests");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSettlementRequests();
  }, []);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await getEmployeesInfo();
        setEmployees(response.data);
      } catch (error) {
        setEmployees([]);
        console.error("Error fetching employees:", error);
        toast.error("Error fetching employees");
      }
    };

    fetchEmployees();
  }, []);

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
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs font-medium">
                            {claimTypes.find(type => type.id === req.settlement_type_id)?.settlement_item || "Unknown"}
                          </span>
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
                        
                        <div className="flex items-center gap-2 text-gray-800">
                          <DollarSign size={16} className="text-green-600" />
                          <span className="font-semibold">{req.amount}</span>
                        </div>
                        
                        {req.event_date && (
                          <div className="flex items-center gap-2 text-gray-700 text-sm">
                            <Calendar size={14} />
                            <span>{req.event_date}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-gray-700 text-sm">
                          <User size={14} />
                          <span>
                            {employees.find(employee => employee.id === req.claimant_id)?.name || "Unknown"}
                          </span>
                        </div>
                        
                        {req.description && (
                          <div className="mt-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                            <p className="font-medium mb-1">Description:</p>
                            <p>{req.description}</p>
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
                      </div>
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
              <h3 className="text-lg font-medium text-gray-900">No settlement requests</h3>
              <p className="mt-1 text-gray-500">Completed settlement requests will appear here</p>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
