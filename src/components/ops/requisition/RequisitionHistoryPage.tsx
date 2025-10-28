"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  XCircle,
  PackageOpen,
  Calendar,
} from "lucide-react";
import { extractFileNameFromStoragePath } from "@/lib/utils";
import { useEmployees } from "@/hooks/useEmployees";
import { useRequisitionInventories } from "@/hooks/useConfigTypes";
import { useRequisitionTypes } from "@/hooks/useConfigTypes";
import { useRequisitionRequests } from "@/hooks/useRequisition";
import LoadingSection from "@/app/(home)/home/components/LoadingSection";
import { RequisitionCard } from "./RequisitionCard";

export default function RequisitionHistoryPage() {
  const { employees, fetchEmployees } = useEmployees();
  const { requisitionTypes, fetchRequisitionTypes } = useRequisitionTypes();
  const { requisitionInventories, fetchRequisitionInventories } = useRequisitionInventories();
  const {
    requisitionRequests,
    loading,
    error,
    fetchRequisitionHistory,
  } = useRequisitionRequests();

  useEffect(() => {
    fetchRequisitionHistory();
  }, [fetchRequisitionHistory]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    fetchRequisitionTypes();
    fetchRequisitionInventories();
  }, [fetchRequisitionTypes, fetchRequisitionInventories]);

  return (
    <AnimatePresence mode="wait">
      {loading && (
        <LoadingSection
          text="Loading requisition history..."
          icon={Calendar}
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
          <h1 className="text-xl font-bold text-blue-700">Requisition History</h1>

          {requisitionRequests.length > 0 ? (
            <div className="space-y-4">
              <AnimatePresence>
                {requisitionRequests.map((req) => (
                  <RequisitionCard
                    key={req.id}
                    req={req}
                    mode="history" // ✅ history mode
                    requisitionTypes={requisitionTypes}
                    requisitionInventories={requisitionInventories}
                    employees={employees}
                    extractFileNameFromStoragePath={extractFileNameFromStoragePath}
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
                <PackageOpen className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                No requisition history
              </h3>
              <p className="mt-1 text-gray-500">
                Completed requisition requests will appear here
              </p>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
