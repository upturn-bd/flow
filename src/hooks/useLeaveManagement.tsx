"use client";

import { useBaseEntity } from "./core";
import { LeaveType, HolidayConfig, WeeklyHolidayConfig } from "@/lib/types";

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
    tableName: "other_holiday_configs",
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
    tableName: "leave_records",
    entityName: "leave record",
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

export function useWeeklyHolidayConfigs() {
  const baseResult = useBaseEntity<WeeklyHolidayConfig>({
    tableName: "weekly_holiday_configs",
    entityName: "weekly holiday config",
    companyScoped: true,
  });

  return {
    ...baseResult,
    weeklyHolidayConfigs: baseResult.items,
    fetchWeeklyHolidayConfigs: baseResult.fetchItems,
    createWeeklyHolidayConfig: baseResult.createItem,
    updateWeeklyHolidayConfig: baseResult.updateItem,
    deleteWeeklyHolidayConfig: baseResult.deleteItem,
  };
}
