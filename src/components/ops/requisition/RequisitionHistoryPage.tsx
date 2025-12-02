"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader,
  XCircle,
  PackageOpen,
  Calendar,
  Plus,
} from "@/lib/icons";
import { extractFileNameFromStoragePath } from "@/lib/utils";
import { useEmployees } from "@/hooks/useEmployees";
import { useRequisitionInventories } from "@/hooks/useConfigTypes";
import { useRequisitionTypes } from "@/hooks/useConfigTypes";
import { useRequisitionRequests, RequisitionState } from "@/hooks/useRequisition";
import { useAuth } from "@/lib/auth/auth-context";
import LoadingSection from "@/app/(home)/home/components/LoadingSection";
import { RequisitionCard } from "./RequisitionCard";
import RequisitionEditModal from "./RequisitionEditModal";
import RequisitionCreateModal from "./RequisitionCreateModal";

export default function RequisitionHistoryPage() {
  const { employees, fetchEmployees } = useEmployees();
  const { requisitionTypes, fetchRequisitionTypes } = useRequisitionTypes();
  const { requisitionInventories, fetchRequisitionInventories } = useRequisitionInventories();
  const {
    requisitionRequests,
    loading,
    error,
    fetchRequisitionHistory,
    updateRequisition,
  } = useRequisitionRequests();
  const { employeeInfo, canWrite, canApprove } = useAuth();

  // State for edit modal
  const [editingRequisition, setEditingRequisition] = useState<RequisitionState | null>(null);
  // State for create modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Check if user can edit a requisition
  const canEditRequisition = useCallback((req: RequisitionState) => {
    if (!employeeInfo) return false;
    
    // User can edit if:
    // 1. They are the owner of the requisition
    // 2. They have write permission for requisition module
    // 3. They have approval permission for requisition module (supervisors/managers)
    const isOwner = req.employee_id === employeeInfo.id;
    const hasWritePermission = canWrite('requisition');
    const hasApprovalPermission = canApprove('requisition');
    
    return isOwner || hasWritePermission || hasApprovalPermission;
  }, [employeeInfo, canWrite, canApprove]);

  const handleEditClick = (req: RequisitionState) => {
    setEditingRequisition(req);
  };

  const handleCloseEditModal = () => {
    setEditingRequisition(null);
  };

  const handleUpdateRequisition = async (id: number, data: Partial<RequisitionState>) => {
    const result = await updateRequisition(id, data);
    return result;
  };

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
    <>
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
            className="p-4 sm:p-6 space-y-6"
          >
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-bold text-blue-700">Requisition History</h1>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus size={18} />
                <span>Add Requisition</span>
              </motion.button>
            </div>

            {requisitionRequests.length > 0 ? (
              <div className="space-y-4">
                <AnimatePresence>
                  {requisitionRequests.map((req) => (
                    <RequisitionCard
                      key={req.id}
                      req={req}
                      mode="history"
                      requisitionTypes={requisitionTypes}
                      requisitionInventories={requisitionInventories}
                      employees={employees}
                      extractFileNameFromStoragePath={extractFileNameFromStoragePath}
                      canEdit={canEditRequisition(req)}
                      onEdit={handleEditClick}
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
                <div className="bg-background-tertiary dark:bg-background-tertiary rounded-full p-4 mb-4">
                  <PackageOpen className="h-12 w-12 text-foreground-tertiary dark:text-foreground-tertiary" />
                </div>
                <h3 className="text-lg font-medium text-foreground-primary dark:text-foreground-primary">
                  No requisition history
                </h3>
                <p className="mt-1 text-foreground-secondary dark:text-foreground-secondary">
                  Completed requisition requests will appear here
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      {editingRequisition && (
        <RequisitionEditModal
          isOpen={!!editingRequisition}
          requisition={editingRequisition}
          onClose={handleCloseEditModal}
          onSubmit={handleUpdateRequisition}
        />
      )}

      {/* Create Modal */}
      <RequisitionCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => fetchRequisitionHistory()}
      />
    </>
  );
}
