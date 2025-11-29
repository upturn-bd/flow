"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRequisitionRequests, RequisitionState } from "@/hooks/useRequisition";
import { supabase } from "@/lib/supabase/client";
import {
  Loader,
  ClipboardList,
  Clock,
  AlertCircle,
  Plus,
  WarningCircle,
} from "@/lib/icons";
import TabView from "@/components/ui/TabView";
import { RequisitionCard } from "@/components/ops/requisition/RequisitionCard";
import RequisitionCreateModal from "@/components/ops/requisition/RequisitionCreateModal";
import RequisitionEditModal from "@/components/ops/requisition/RequisitionEditModal";
import { RequisitionType, RequisitionInventory } from "@/lib/types";
import { useAuth } from "@/lib/auth/auth-context";

export default function RequisitionPage() {
  const {
    requisitionRequests,
    fetchRequisitionRequests,
    fetchRequisitionHistory,
    updateRequisitionRequest,
    updateRequisition,
    loading,
    processingId,
  } = useRequisitionRequests();

  const {
    canApprove,
    canWrite,
    employeeInfo,
  } = useAuth()

  const MODULE = "Requisition";

  const [activeTab, setActiveTab] = useState("requests");
  const [requisitionTypes, setRequisitionTypes] = useState<RequisitionType[]>([]);
  const [requisitionInventories, setRequisitionInventories] = useState<RequisitionInventory[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [filtered, setFiltered] = useState(requisitionRequests);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRequisition, setEditingRequisition] = useState<RequisitionState | null>(null);

  // Check if user can edit a requisition
  const canEditRequisition = useCallback((req: RequisitionState) => {
    if (!employeeInfo) return false;
    
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
    if (result) {
      refreshData();
    }
    return result;
  };

  // Load requisition types, inventories, and requests/history
  useEffect(() => {
    const load = async () => {
      if (activeTab === "requests") await fetchRequisitionRequests("Pending", true);
      else await fetchRequisitionHistory(true);

      const { data: types } = await supabase.from("requisition_types").select("*");
      setRequisitionTypes(types || []);

      const { data: inventories } = await supabase.from("requisition_inventories").select("*");
      setRequisitionInventories(inventories || []);

      const { data: emps } = await supabase.from("employees").select("id, first_name, last_name, email, designation");
      // Format employees to include name field for RequisitionCard
      const formattedEmployees = (emps || []).map((emp: any) => ({
        ...emp,
        name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Unknown'
      }));
      setEmployees(formattedEmployees);
    };
    load();
  }, [activeTab]);

  // Filter requisitions (optional searchTerm can be added here)
  useEffect(() => {
    setFiltered(requisitionRequests);
  }, [requisitionRequests]);

  // Adapter: RequisitionCard expects (status: string, reqId: string, employeeId: string, comment?: string) => void
  const handleUpdateRequest = (
    status: string,
    reqId: string,
    employeeId: string,
    comment?: string
  ) => {
    (async () => {
      const id = parseInt(reqId as any, 10) || 0;
      await updateRequisitionRequest(status as "Approved" | "Rejected", id, comment || "", employeeId);
    })();
  };

  const extractFileNameFromStoragePath = (path: string) => path.split("/").pop() || path;

  const refreshData = async () => {
    if (activeTab === "requests") await fetchRequisitionRequests("Pending", true);
    else await fetchRequisitionHistory(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="text-blue-600" size={26} />
          <h1 className="text-2xl font-semibold">Requisition Logs</h1>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          <span>Add Requisition</span>
        </button>
      </div>

      <div className="mt-4">
        <TabView
          tabs={[
            {
              key: "requests",
              label: "Requests",
              icon: <ClipboardList />,
              color: "text-blue-500",
              content: (
                <>
                  {loading && (
                    <div className="flex justify-center items-center py-20 text-foreground-tertiary">
                      <Loader className="animate-spin mr-2" />
                      Loading requisitions...
                    </div>
                  )}

                  {!loading && filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-foreground-tertiary">
                      <WarningCircle className="mb-2" size={28} />
                      <p>No pending requisition requests found.</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    {!loading &&
                      filtered.map((req: any) => (
                        <RequisitionCard
                          key={req.id}
                          req={req}
                          requisitionTypes={requisitionTypes}
                          requisitionInventories={requisitionInventories}
                          employees={employees}
                          extractFileNameFromStoragePath={extractFileNameFromStoragePath}
                          mode="request"
                          handleUpdateRequest={handleUpdateRequest}
                          processingId={processingId?.toString()}
                          canApprove={canApprove(MODULE)}
                          canEdit={canEditRequisition(req as RequisitionState)}
                          onEdit={handleEditClick}
                        />
                      ))}
                  </div>
                </>
              ),
            },
            {
              key: "history",
              label: "History",
              icon: <Clock />,
              color: "text-foreground-tertiary",
              content: (
                <>
                  {loading && (
                    <div className="flex justify-center items-center py-20 text-foreground-tertiary">
                      <Loader className="animate-spin mr-2" />
                      Loading history...
                    </div>
                  )}

                  {!loading && filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-foreground-tertiary">
                      <WarningCircle className="mb-2" size={28} />
                      <p>No past requisitions found.</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    {!loading &&
                      filtered.map((req: any) => (
                        <RequisitionCard
                          key={req.id}
                          req={req}
                          requisitionTypes={requisitionTypes}
                          requisitionInventories={requisitionInventories}
                          employees={employees}
                          extractFileNameFromStoragePath={extractFileNameFromStoragePath}
                          mode="history"
                          canEdit={canEditRequisition(req as RequisitionState)}
                          onEdit={handleEditClick}
                        />
                      ))}
                  </div>
                </>
              ),
            },
          ]}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>

      {/* Create Modal */}
      <RequisitionCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={refreshData}
      />

      {/* Edit Modal */}
      {editingRequisition && (
        <RequisitionEditModal
          isOpen={!!editingRequisition}
          requisition={editingRequisition}
          onClose={handleCloseEditModal}
          onSubmit={handleUpdateRequisition}
        />
      )}
    </div>
  );
}
