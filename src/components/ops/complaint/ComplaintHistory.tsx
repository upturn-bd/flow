"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader,
  XCircle,
  Flag,
  User,
  CheckCheck,
  MessageCircle,
  FileText,
  Clock,
  List
} from "@/lib/icons";
import { extractFileNameFromStoragePath, extractFilenameFromUrl } from "@/lib/utils";
import { useEmployees } from "@/hooks/useEmployees";
import { useComplaintTypes } from "@/hooks/useConfigTypes";
import { useComplaints } from "@/hooks/useComplaints";
import LoadingSection from "@/app/(home)/home/components/LoadingSection";
import { ComplaintCard } from "./ComplaintCard";

export default function ComplaintHistoryPage() {
  const { employees, fetchEmployees } = useEmployees();
  const { complaintTypes, fetchComplaintTypes } = useComplaintTypes();
  const {
    complaintHistory: complaints,
    historyLoading: loading,
    error,
    fetchComplaintHistory
  } = useComplaints();

  useEffect(() => {
    fetchComplaintHistory();
  }, []);

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
          className="p-4 sm:p-6 space-y-6"
        >
          <h1 className="text-xl font-bold text-blue-700">Complaint History</h1>

          {complaints.length > 0 ? (
            <div className="space-y-4">
              <AnimatePresence>
                {complaints.map((complaint) => (
                  // USE COMPLAINTCARD HERE CHATGPT
                  <ComplaintCard
                    key={complaint.id}
                    complaint={complaint}
                    employees={employees}
                    complaintTypes={complaintTypes}
                    extractFileNameFromStoragePath={extractFileNameFromStoragePath}
                    mode="history"
                    isProcessing={false} // history cards don’t have processing state
                  />
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
