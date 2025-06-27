"use client";

import { useBaseEntity } from "./core";
import { LeaveType, HolidayConfig } from "@/lib/types";

// Export types for components
export type { LeaveType, HolidayConfig };

export function useLeaveTypes() {
  const baseResult = useBaseEntity<LeaveType>({
    tableName: "leave_types",
    entityName: "leave type",
    companyScoped: true,
  });
  
  return {
    ...baseResult,
    leaveTypes: baseResult.items,
    fetchLeaveTypes: baseResult.fetchItems,
    createLeaveType: baseResult.createItem,
    updateLeaveType: baseResult.updateItem,
    deleteLeaveType: baseResult.deleteItem,
  };
}

export function useHolidayConfigs() {
  const baseResult = useBaseEntity<HolidayConfig>({
    tableName: "holiday_configs",
    entityName: "holiday config",
    companyScoped: true,
  });
  
  return {
    ...baseResult,
    holidayConfigs: baseResult.items,
    fetchHolidayConfigs: baseResult.fetchItems,
    createHolidayConfig: baseResult.createItem,
    updateHolidayConfig: baseResult.updateItem,
    deleteHolidayConfig: baseResult.deleteItem,
  };
}

export function useLeaveRequests() {
  const baseResult = useBaseEntity<any>({
    tableName: "leave_requests",
    entityName: "leave request",
    companyScoped: true,
  });

  return {
    ...baseResult,
    leaveRequests: baseResult.items,
    fetchLeaveRequests: baseResult.fetchItems,
    updateLeaveRequest: baseResult.updateItem,
    processingId: baseResult.updating,
  };
}
