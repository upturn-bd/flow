"use client";

import AttendanceManagementView from "@/components/admin-management/attendance/AttendanceManagementView";
import ClaimSettlementView from "@/components/admin-management/settlement/SettlementView";
import ComplaintsView from "@/components/admin-management/complaints/ComplaintsManagementView";
import InventoryManagementView from "@/components/admin-management/inventory/InventoryManagementView";
import LeaveManagementView from "@/components/admin-management/leave/LeaveManagementView";
import NewsAndNoticeView from "@/components/admin-management/news-and-notice/NewsAndNoticeManagementView";
import SupervisorLineageView from "@/components/admin-management/supervisor-lineage/SupervisorLineageView";
import { Suspense } from "react";

export default function AdministrativeManagement() {
  return (
    <div className="space-y-2 py-12 px-6 max-w-4xl mx-auto lg:mx-20">
      <h2 className="text-2xl font-bold text-blue-700">
        Step 2: Administrative Management
      </h2>
      <Suspense fallback={<div className="p-4 text-center">Loading administrative management components...</div>}>
        <SupervisorLineageView />
        <AttendanceManagementView />
        <LeaveManagementView />
        <InventoryManagementView />
        <ClaimSettlementView />
        <NewsAndNoticeView />
        <ComplaintsView/>
      </Suspense>
    </div>
  );
}
