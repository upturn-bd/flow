"use client";

import { useRequisitionInventories } from "@/hooks/useInventory";
import { useRequisitionTypes } from "@/hooks/useRequisitionTypes";
import { getCompanyId, getUserInfo } from "@/lib/auth/getUser";
import { createClient } from "@/lib/supabase/client";
import React, { useEffect, useState } from "react";
import { RequisitionState } from "./RequisitionCreatePage";
import { getEmployeesInfo } from "@/lib/api/admin-management/inventory";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, 
  XCircle, 
  PackageOpen, 
  Calendar, 
  Clock, 
  User, 
  CheckCheck, 
  TagIcon, 
  FileText 
} from "lucide-react";
import { toast } from "sonner";
import { extractFilenameFromUrl } from "@/lib/utils";

export default function RequisitionHistoryPage() {
  const [requisitionRequests, setRequisitionRequests] = useState<
    RequisitionState[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { requisitionTypes, fetchRequisitionTypes } = useRequisitionTypes();
  const { requisitionInventories, fetchRequisitionInventories } =
    useRequisitionInventories();
  const [comment, setComment] = useState<string>("");
  const [employees, setEmployees] = useState<any[]>([]);

  async function fetchRequisitionRequests() {
    setLoading(true);
    const supabase = createClient();
    const user = await getUserInfo();
    const company_id = await getCompanyId();
    try {
      const { data, error } = await supabase
        .from("requisition_records")
        .select("*")
        .eq("company_id", company_id)
        .eq("asset_owner", user.id)
        .neq("status", "Pending");

      if (error) {
        setError("Failed to fetch requisition requests");
        toast.error("Failed to fetch requisition requests");
        throw error;
      }

      setRequisitionRequests(data);
    } catch (error) {
      setError("Failed to fetch requisition requests");
      toast.error("Failed to fetch requisition requests");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRequisitionRequests();
  }, []);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await getEmployeesInfo();
        setEmployees(response.data || []);
      } catch (error) {
        setEmployees([]);
        console.error("Error fetching asset owners:", error);
        toast.error("Error fetching employees");
      }
    };

    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchRequisitionTypes();
    fetchRequisitionInventories();
  }, [fetchRequisitionTypes, fetchRequisitionInventories]);

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
          <p className="text-gray-500">Loading requisition history...</p>
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
          <h1 className="text-xl font-bold text-blue-700">Requisition History</h1>

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
                          <span>{req.from_time} - {req.to_time}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3 flex items-center gap-2 text-sm text-gray-700">
                      <User size={14} />
                      <span>Requested by: <span className="font-medium">
                        {employees.find(employee => employee.id === req.employee_id)?.name || "Unknown"}
                      </span></span>
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
              <h3 className="text-lg font-medium text-gray-900">No requisition history</h3>
              <p className="mt-1 text-gray-500">Completed requisition requests will appear here</p>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
