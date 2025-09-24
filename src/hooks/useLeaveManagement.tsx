"use client";

import { getEmployeeInfo } from "@/lib/utils/auth";
import { useBaseEntity } from "./core";
import { LeaveType, HolidayConfig, WeeklyHolidayConfig } from "@/lib/types";
import { useNotifications } from "./useNotifications";
import { create } from "domain";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useLeaveBalances } from "./useLeaveBalances";

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

  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const { reduceBalance } = useLeaveBalances()

  const { createNotification } = useNotifications();
  const createLeaveRequest = async (leaveData: any) => {
    try {
      const user = await getEmployeeInfo();
      const company_id = user.company_id;
      const result = await baseResult.createItem(leaveData);
      const recipients = [user.supervisor_id].filter(Boolean) as string[];
      createNotification({
        title: "New Leave Request",
        message: `A new leave request has been submitted by ${user.name}.`,
        priority: 'normal',
        type_id: 2,
        recipient_id: recipients,
        action_url: '/operations-and-services/services/leave',
        company_id: user.company_id,
        department_id: user.department_id
      })

      return result;
    } catch (error) {
      console.error("Error creating leave request:", error);
      throw error;
    }
  }


  const updateLeaveRequest = async (leaveId: number, leaveData: any, leaveTypeId: number, employeeId: string, start_date: string, end_date: string) => {
    try {
      const user = await getEmployeeInfo();

      const result = await baseResult.updateItem(leaveId, leaveData);

      const recipients = [user.id].filter(Boolean) as string[];

      if (leaveData.status === "Accepted") {
        const parseDate = (str: string) => new Date(str.replace(" ", "T"));

        const start = parseDate(start_date);
        const end = parseDate(end_date);

        const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
        const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());

        const diffInDays = Math.floor((endUtc - startUtc) / (1000 * 60 * 60 * 24)) + 1;

        console.log(diffInDays);
        console.log("Duff dats,", diffInDays)
        await reduceBalance(
          employeeId,  // make sure the field name matches your table
          leaveTypeId,
          diffInDays
        );
      }

      createNotification({
        title: "Leave request updated",
        message: `Your leave request has been updated to status: ${leaveData.status}.`,
        priority: 'normal',
        type_id: 2,
        recipient_id: recipients,
        action_url: '/operations-and-services/services/leave',
        company_id: user.company_id,
        department_id: user.department_id
      });


      return result;
    } catch (error) {
      console.error("Error updating leave request:", error);
      throw error;
    }

  }

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);

      const user = await getEmployeeInfo();
      const { data, error } = await supabase
        .from("leave_records")
        .select("*")
        .eq("requested_to", user.id)
        .eq("status", "Pending")

      if (error) throw error;

      setLeaveRequests(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      throw error;
    }
  }

  return {
    ...baseResult,
    loading,
    leaveRequests,
    createLeaveRequest,
    fetchLeaveRequests,
    updateLeaveRequest,
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
