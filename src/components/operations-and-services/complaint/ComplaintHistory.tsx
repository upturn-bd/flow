"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, 
  XCircle, 
  Flag, 
  User, 
  CheckCheck, 
  MessageSquare,
  FileText,
  Clock,
  List
} from "lucide-react";
import { extractFilenameFromUrl } from "@/lib/utils";
import { useEmployees } from "@/hooks/useEmployees";
import { useComplaintTypes } from "@/hooks/useConfigTypes";
import { useComplaints } from "@/hooks/useComplaints";
import LoadingSection from "@/app/(home)/home/components/LoadingSection";

export default function ComplaintHistoryPage() {
  const { employees, fetchEmployees } = useEmployees();
  const { complaintTypes, fetchComplaintTypes } = useComplaintTypes();
  const { 
    complaints, 
    loading, 
    error, 
    fetchComplaintHistory
  } = useComplaints();

  useEffect(() => {
    fetchComplaintHistory();
  }, [fetchComplaintHistory]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    fetchComplaintTypes();
  }, [fetchComplaintTypes]);

  return (
    <AnimatePresence mode="wait">
      {loading && (
        <LoadingSection 
          text="Loading complaint history..."
          icon={List}
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
          <h1 className="text-xl font-bold text-blue-700">Complaint History</h1>

          {complaints.length > 0 ? (
            <div className="space-y-4">
              <AnimatePresence>
                {complaints.map((complaint) => (
                  <motion.div
                    key={complaint.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-2">
                        <Flag className="text-blue-600 mt-1" size={18} />
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {complaintTypes.find(type => type.id === complaint.complaint_type_id)?.name || "Unknown"}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {complaint.anonymous ? "Anonymous Complaint" : "Named Complaint"}
                          </p>
                        </div>
                      </div>
                      
                      <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full
                        ${complaint.status === 'Accepted' 
                          ? 'bg-green-100 text-green-800' 
                          : complaint.status === 'Rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {complaint.status === 'Accepted' ? (
                          <CheckCheck size={12} />
                        ) : complaint.status === 'Rejected' ? (
                          <XCircle size={12} />
                        ) : (
                          <Clock size={12} />
                        )}
                        <span>{complaint.status}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <User size={14} />
                        <span>Requested by: <span className="font-medium">
                          {complaint.anonymous ? "Anonymous" : 
                            employees.find(employee => employee.id === complaint.complainer_id)?.name || "Unknown"}
                        </span></span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <User size={14} />
                        <span>Against: <span className="font-medium">
                          {employees.find(employee => employee.id === complaint.against_whom)?.name || "Unknown"}
                        </span></span>
                      </div>
                    </div>
                    
                    {complaint.description && (
                      <div className="mt-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                        <p className="font-medium mb-1">Description:</p>
                        <p>{complaint.description}</p>
                      </div>
                    )}
                    
                    {complaint.comment && (
                      <div className="mt-3 text-sm text-gray-700 bg-blue-50 p-3 rounded-md">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare size={14} />
                          <p className="font-medium">Feedback:</p>
                        </div>
                        <p>{complaint.comment}</p>
                      </div>
                    )}

                    {complaint.attachments && complaint.attachments.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Attachments:</p>
                        <div className="flex flex-wrap gap-2">
                          {complaint.attachments.map((attachment, idx) => (
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
                <Flag className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No complaint history</h3>
              <p className="mt-1 text-gray-500">Completed complaint requests will appear here</p>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
