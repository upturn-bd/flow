"use client";

import { Suspense } from "react";
import SupervisorLineageView from "../supervisor-lineage/SupervisorLineageView";
import AttendanceManagementView from "../attendance/AttendanceManagementView";
import LeaveManagementView from "../leave/LeaveManagementView";
import InventoryManagementView from "../inventory/InventoryManagementView";
import SettlementView from "../settlement/SettlementView";
import NoticeManagementView from "../notice/NoticeManagementView";
import ComplaintsManagementView from "../complaints/ComplaintsManagementView";
import StakeholderTypeManagementView from "../stakeholder-types/StakeholderTypeManagementView";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function AdvancedTab() {
  return (
    <div className="space-y-4">
      <Suspense fallback={
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      }>
        <div className="space-y-4">
            <SupervisorLineageView />

            <AttendanceManagementView />

            <LeaveManagementView />

            <InventoryManagementView />

            <SettlementView />

            <NoticeManagementView />

            <ComplaintsManagementView />

            <StakeholderTypeManagementView />
        </div>
      </Suspense>
    </div>
  );
}
