"use client";

import React, { useEffect, useState } from "react";
import { useLeaveRequests } from "@/hooks/useLeaveManagement";
import { useLeaveTypes } from "@/hooks/useLeaveManagement";
import { useEmployeesContext } from "@/contexts";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X as CloseIcon, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { getEmployeeName } from "@/lib/utils/auth";
import TabView, { TabItem } from "@/components/ui/TabView";
import { useAuth } from "@/lib/auth/auth-context";

type LeaveRecord = {
   id: number;
   type_id: number;
   leave_type_name?: string;
   start_date: string;
   end_date: string;
   description?: string;
   remarks?: string;
   status: string;
   employee_id: string;
};

export default function LeaveLogsPage() {
   const {
      leaveRequests,
      fetchGlobalLeaveRequests,
      fetchGlobalLeaveHistory,
      updateLeaveRequest,
      loading,
   } = useLeaveRequests();

   const {
      canApprove
   } = useAuth();

   const MODULE = "leave";

   const { leaveTypes, fetchLeaveTypes } = useLeaveTypes();
   const { fetchEmployees } = useEmployeesContext();
   const [employeeNames, setEmployeeNames] = useState<Record<string, string>>({});
   const [activeTab, setActiveTab] = useState<"requests" | "history">("requests");

   const [selectedLeave, setSelectedLeave] = useState<LeaveRecord | null>(null);

   // Fetch leave types + employee info + leave data
   useEffect(() => {
      fetchLeaveTypes();
      fetchEmployees();
      if (activeTab === "requests") {
         fetchGlobalLeaveRequests();
      } else {
         fetchGlobalLeaveHistory();
      }
   }, [activeTab]);

   // Fetch employee names for display
   useEffect(() => {
      const fetchNames = async () => {
         const namesMap: Record<string, string> = {};
         await Promise.all(
            leaveRequests.map(async (lr) => {
               if (lr.employee_id && !namesMap[lr.employee_id]) {
                  namesMap[lr.employee_id] = await getEmployeeName(lr.employee_id);
               }
            })
         );
         setEmployeeNames(namesMap);
      };
      fetchNames();
   }, [leaveRequests]);

   const getLeaveTypeName = (typeId: number) => {
      const type = leaveTypes?.find((t) => t.id === typeId);
      return type ? type.name : "N/A";
   };

   const statusStyles: Record<string, string> = {
      Pending: "bg-yellow-100 text-yellow-800",
      Accepted: "bg-green-100 text-green-800",
      Rejected: "bg-red-100 text-red-800",
   };

   const handleUpdateStatus = async (
      leave: LeaveRecord,
      status: "Accepted" | "Rejected" | "Pending"
   ) => {
      try {
         await updateLeaveRequest(
            leave.id,
            { status },
            leave.type_id,
            leave.employee_id,
            leave.start_date,
            leave.end_date
         );
         toast.success(`Leave request ${status.toLowerCase()} successfully!`);
         if (activeTab === "requests") {
            fetchGlobalLeaveRequests();
         } else {
            fetchGlobalLeaveHistory();
         }
         setSelectedLeave(null);
      } catch (err) {
         console.error(err);
         toast.error("Failed to update leave request.");
      }
   };

   const calculateTotalDays = (start_date: string, end_date: string) => {
      const start = new Date(start_date);
      const end = new Date(end_date);
      const diff = Math.floor(
         (Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) -
            Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) /
         (1000 * 60 * 60 * 24)
      );
      return diff + 1;
   };

   const renderTable = (isHistory: boolean) => {
      if (loading) {
         return (
            <div className="flex justify-center items-center h-32">
               <Loader2 className="animate-spin text-gray-500" />
            </div>
         );
      }

      if (leaveRequests.length === 0) {
         return <p className="text-gray-500 text-sm mt-2">No leave records found.</p>;
      }

      return (
         <div className="overflow-x-auto">
            <table className="w-full table-auto border border-gray-200 rounded-lg shadow-sm">
               <thead className="bg-gray-100 text-gray-700 uppercase text-sm">
                  <tr>
                     <th className="px-4 py-3 border-b">Employee</th>
                     <th className="px-4 py-3 border-b">Leave Type</th>
                     <th className="px-4 py-3 border-b">Dates</th>
                     <th className="px-4 py-3 border-b">Total Days</th>
                     <th className="px-4 py-3 border-b">Status</th>
                     <th className="px-4 py-3 border-b">Actions</th>
                  </tr>
               </thead>
               <tbody>
                  {leaveRequests.map((leave, idx) => (
                     <tr
                        key={leave.id}
                        className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100 transition-all cursor-pointer`}
                        onClick={() => setSelectedLeave(leave)}
                     >
                        <td className="px-4 py-3 border-b font-medium text-gray-800">
                           {employeeNames[leave.employee_id] || "Unknown"}
                        </td>
                        <td className="px-4 py-3 border-b text-gray-600">{getLeaveTypeName(leave.type_id)}</td>
                        <td className="px-4 py-3 border-b text-gray-600">
                           {leave.start_date} to {leave.end_date}
                        </td>
                        <td className="px-4 py-3 border-b text-gray-600">{calculateTotalDays(leave.start_date, leave.end_date)}</td>
                        <td className="px-4 py-3 border-b">
                           <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusStyles[leave.status] || "bg-gray-100 text-gray-700"}`}>
                              {leave.status}
                           </span>
                        </td>

                        {canApprove(MODULE) && (
                           <td className="px-4 py-3 border-b flex gap-2">
                              {!isHistory && leave.status === "Pending" && (
                                 <>
                                    <Button size="sm" variant="complete" className="p-2 hover:bg-green-100 transition-colors" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(leave, "Accepted"); }}>
                                       <Check size={16} />
                                    </Button>
                                    <Button size="sm" variant="danger" className="p-2 hover:bg-red-100 transition-colors" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(leave, "Rejected"); }}>
                                       <CloseIcon size={16} />
                                    </Button>
                                 </>
                              )}
                              {isHistory && leave.status !== "Pending" && (
                                 <Button size="sm" variant="outline" className="p-2 hover:bg-yellow-100 transition-colors" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(leave, "Pending"); }}>
                                    <RotateCw size={16} />
                                 </Button>
                              )}
                           </td>
                        )}
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      );
   };

   const tabs: TabItem[] = [
      { key: "requests", label: "Requests", icon: <Check size={16} />, color: "text-green-600", content: renderTable(false) },
      { key: "history", label: "History", icon: <RotateCw size={16} />, color: "text-yellow-600", content: renderTable(true) },
   ];

   return (
      <div className="max-w-7xl mx-auto py-8 px-4">
         <Card className="shadow-lg rounded-xl">
            <CardHeader title="Company Leave Management" subtitle="View and manage employee leave requests and history." />
            <CardContent>
               <TabView tabs={tabs} activeTab={activeTab} setActiveTab={(key: string) => setActiveTab(key as "requests" | "history")} />

               {/* Leave Details Modal */}
               {selectedLeave && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                     <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 relative">
                        <button className="absolute top-3 right-3 text-gray-500 hover:text-gray-800" onClick={() => setSelectedLeave(null)}>
                           <CloseIcon size={20} />
                        </button>
                        <h2 className="text-lg font-semibold mb-4">Leave Details</h2>
                        <div className="space-y-2 text-gray-700">
                           <p><strong>Employee:</strong> {employeeNames[selectedLeave.employee_id] || "Unknown"}</p>
                           <p><strong>Type:</strong> {getLeaveTypeName(selectedLeave.type_id)}</p>
                           <p><strong>Dates:</strong> {selectedLeave.start_date} to {selectedLeave.end_date} ({calculateTotalDays(selectedLeave.start_date, selectedLeave.end_date)} days)</p>
                           {selectedLeave.description && <p><strong>Description:</strong> {selectedLeave.description}</p>}
                           {selectedLeave.remarks && <p><strong>Remarks:</strong> {selectedLeave.remarks}</p>}
                           <p><strong>Status:</strong> <span className={`px-2 py-1 rounded-full ${statusStyles[selectedLeave.status]}`}>{selectedLeave.status}</span></p>
                        </div>

                        {/* Actions */}
                        <div className="mt-4 flex justify-end gap-2">
                           {selectedLeave.status === "Pending" && (
                              <>
                                 <Button
                                    variant="complete"
                                    onClick={() => handleUpdateStatus(selectedLeave, "Accepted")}
                                 >
                                    <span className="flex items-center gap-2">
                                       <Check size={16} /> Accept
                                    </span>
                                 </Button>

                                 <Button
                                    variant="danger"
                                    onClick={() => handleUpdateStatus(selectedLeave, "Rejected")}
                                 >
                                    <span className="flex items-center gap-2">
                                       <CloseIcon size={16} /> Reject
                                    </span>
                                 </Button>
                              </>
                           )}

                           {activeTab === "history" && selectedLeave.status !== "Pending" && (
                              <Button
                                 variant="outline"
                                 onClick={() => handleUpdateStatus(selectedLeave, "Pending")}
                              >
                                 <span className="flex items-center gap-2">
                                    <RotateCw size={16} /> Mark Pending
                                 </span>
                              </Button>
                           )}
                        </div>
                     </div>
                  </div>
               )}
            </CardContent>
         </Card>
      </div>
   );
}
