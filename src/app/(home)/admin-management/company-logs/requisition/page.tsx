"use client";

import React, { useEffect, useState } from "react";
import { useRequisitionRequests } from "@/hooks/useRequisition";
import { supabase } from "@/lib/supabase/client";
import {
  Loader2,
  ClipboardList,
  Clock,
  AlertCircle,
} from "lucide-react";
import TabView from "@/components/ui/TabView";
import { RequisitionCard } from "@/components/operations-and-services/requisition/RequisitionCard";
import { RequisitionType, RequisitionInventory } from "@/lib/types";

export default function RequisitionPage() {
  const {
    requisitionRequests,
    fetchRequisitionRequests,
    fetchRequisitionHistory,
    updateRequisitionRequest,
    loading,
    processingId,
  } = useRequisitionRequests();

  const [activeTab, setActiveTab] = useState("requests");
  const [requisitionTypes, setRequisitionTypes] = useState<RequisitionType[]>([]);
  const [requisitionInventories, setRequisitionInventories] = useState<RequisitionInventory[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [filtered, setFiltered] = useState(requisitionRequests);

  // Load requisition types, inventories, and requests/history
  useEffect(() => {
    const load = async () => {
      if (activeTab === "requests") await fetchRequisitionRequests("Pending", true);
      else await fetchRequisitionHistory(true);

      const { data: types } = await supabase.from("requisition_types").select("*");
      setRequisitionTypes(types || []);

      const { data: inventories } = await supabase.from("requisition_inventories").select("*");
      setRequisitionInventories(inventories || []);

      const { data: emps } = await supabase.from("employees").select("*");
      setEmployees(emps || []);
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <ClipboardList className="text-blue-600" size={26} />
        <h1 className="text-2xl font-semibold">Requisition Logs</h1>
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
                    <div className="flex justify-center items-center py-20 text-gray-500">
                      <Loader2 className="animate-spin mr-2" />
                      Loading requisitions...
                    </div>
                  )}

                  {!loading && filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                      <AlertCircle className="mb-2" size={28} />
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
              color: "text-gray-500",
              content: (
                <>
                  {loading && (
                    <div className="flex justify-center items-center py-20 text-gray-500">
                      <Loader2 className="animate-spin mr-2" />
                      Loading history...
                    </div>
                  )}

                  {!loading && filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                      <AlertCircle className="mb-2" size={28} />
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
    </div>
  );
}
