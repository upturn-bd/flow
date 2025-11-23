"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { 
  Loader2, 
  ClipboardList, 
  Clock, 
  AlertCircle, 
  Flag 
} from "lucide-react";
import TabView from "@/components/ui/TabView";
import { ComplaintCard } from "@/components/ops/complaint/ComplaintCard";
import { useEmployeesContext } from "@/contexts";
import { useComplaints } from "@/hooks/useComplaints";
import { useComplaintTypes } from "@/hooks/useConfigTypes";
import LoadingSection from "@/app/(home)/home/components/LoadingSection";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/lib/auth/auth-context";

export default function ComplaintLogsPage() {
  const [activeTab, setActiveTab] = useState<"requests" | "history">("requests");
  const [comment, setComment] = useState<string>("");
  const [currentlyProcessingId, setCurrentlyProcessingId] = useState<number | null>(null);

  const { employees } = useEmployeesContext();
  const { complaintTypes, fetchComplaintTypes } = useComplaintTypes();
  const { 
    complaintHistory,
    complaintRequests,
    loading,
    requestLoading,
    historyLoading,
    error,
    fetchComplaints,
    fetchComplaintRequests,
    fetchComplaintHistory,
    updateComplaint
  } = useComplaints();

  const {
    canApprove,
    canComment
  } = useAuth();

  const MODULE = "complaints";

  // Load complaint types
  useEffect(() => {
    // Employees auto-fetched by context
    fetchComplaintTypes();
  }, [fetchComplaintTypes]);

  // Load complaints based on active tab
  useEffect(() => {
    if (activeTab === "requests") {
      fetchComplaintRequests(true);
    } else {
      fetchComplaintHistory(true);
    }
  }, [activeTab]);

  const handleUpdateRequest = async (action: string, id: number) => {
    setCurrentlyProcessingId(id);
    const complaint = complaintRequests.find(c => c.id === id);
    const againstEmp = employees.find(emp => emp.id === complaint?.against_whom);

    const updateData = { status: "Resolved", comment };
    const result = await updateComplaint(id, updateData, againstEmp?.name || "");

    if (result.success) {
      setComment("");
      fetchComplaintRequests(true);
    }
    setCurrentlyProcessingId(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <ClipboardList className="text-blue-600" size={26} />
        <h1 className="text-2xl font-semibold">Complaint Logs</h1>
      </div>

      {/* Tabs */}
      <div className="mt-4">
        <TabView
          activeTab={activeTab}
          setActiveTab={(k: string) => setActiveTab(k as "requests" | "history")}
          tabs={[
            {
              key: "requests",
              label: "Requests",
              icon: <ClipboardList />,
              color: "text-blue-500",
              content: (
                <>
                  {(requestLoading || loading) && (
                    <LoadingSection
                      text="Loading complaint requests..."
                      icon={ClipboardList}
                      color="blue"
                    />
                  )}

                  {(!loading && !requestLoading) && complaintRequests.length === 0 && (
                    <EmptyState
                      icon={<Flag className="w-12 h-12" />}
                      title="No pending complaint requests"
                      description="When users submit complaints, they'll appear here for review."
                    />
                  )}

                  <div className="space-y-4">
                    <AnimatePresence>
                      {(!loading && !requestLoading) && complaintRequests.map((complaint) => (
                        <ComplaintCard
                          key={complaint.id}
                          complaint={complaint}
                          employees={employees}
                          complaintTypes={complaintTypes}
                          extractFileNameFromStoragePath={(path) => path.split("/").pop() || path}
                          mode="request"
                          onAccept={() => handleUpdateRequest("Accepted", complaint.id)}
                          onReject={() => handleUpdateRequest("Rejected", complaint.id)}
                          isProcessing={currentlyProcessingId === complaint.id}
                          canApprove={canApprove(MODULE)}
                          canComment={canComment(MODULE)}
                        />
                      ))}
                    </AnimatePresence>
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
                  {historyLoading && (
                    <LoadingSection
                      text="Loading complaint history..."
                      icon={Clock}
                      color="gray"
                    />
                  )}

                  {!historyLoading && complaintHistory.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="bg-gray-100 rounded-full p-4 mb-4">
                        <Flag className="h-12 w-12 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">No complaint history</h3>
                      <p className="mt-1 text-gray-500">Completed complaint requests will appear here</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <AnimatePresence>
                      {!historyLoading && complaintHistory.map((complaint) => (
                        <ComplaintCard
                          key={complaint.id}
                          complaint={complaint}
                          employees={employees}
                          complaintTypes={complaintTypes}
                          extractFileNameFromStoragePath={(path) => path.split("/").pop() || path}
                          mode="history"
                          isProcessing={false}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
