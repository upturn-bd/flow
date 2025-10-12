"use client";

import { getCompanyId, getEmployeeInfo } from "@/lib/utils/auth";
import { useBaseEntity } from "./core";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useLeaveBalances } from "./useLeaveBalances";
import { useNotifications } from "./useNotifications";
import { HolidayConfig, LeaveType } from "@/lib/types";


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

  const { reduceBalance } = useLeaveBalances();
  const { createNotification } = useNotifications();

  // Create leave request (same as before)
  const createLeaveRequest = async (leaveData: any) => {
    try {
      const user = await getEmployeeInfo();
      const result = await baseResult.createItem(leaveData);

      const recipients = [user.supervisor_id].filter(Boolean) as string[];
      createNotification({
        title: "New Leave Request",
        message: `A new leave request has been submitted by ${user.name}.`,
        priority: "normal",
        type_id: 2,
        recipient_id: recipients,
        action_url: "/operations-and-services/services/leave",
        company_id: user.company_id,
        department_id: user.department_id,
      });

      return result;
    } catch (error) {
      console.error("Error creating leave request:", error);
      throw error;
    }
  };

  // Update leave request (same as before)
  const updateLeaveRequest = async (
    leaveId: number,
    leaveData: any,
    leaveTypeId: number,
    employeeId: string,
    start_date: string,
    end_date: string
  ) => {
    try {
      const user = await getEmployeeInfo();
      const result = await baseResult.updateItem(leaveId, leaveData);

      const recipients = [user.id].filter(Boolean) as string[];

      if (leaveData.status === "Accepted") {
        const parseDate = (str: string) => new Date(str.replace(" ", "T"));
        const start = parseDate(start_date);
        const end = parseDate(end_date);

        const diffInDays =
          Math.floor(
            (Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) -
              Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) /
              (1000 * 60 * 60 * 24)
          ) + 1;

        await reduceBalance(employeeId, leaveTypeId, diffInDays);
      }

      createNotification({
        title: "Leave request updated",
        message: `Your leave request has been updated to status: ${leaveData.status}.`,
        priority: "normal",
        type_id: 2,
        recipient_id: recipients,
        action_url: "/operations-and-services/services/leave",
        company_id: user.company_id,
        department_id: user.department_id,
      });

      return result;
    } catch (error) {
      console.error("Error updating leave request:", error);
      throw error;
    }
  };

  // Fetch pending requests (default: only assigned to user)
  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const user = await getEmployeeInfo();
      const { data, error } = await supabase
        .from("leave_records")
        .select("*")
        .eq("requested_to", user.id)
        .eq("status", "Pending");

      if (error) throw error;

      setLeaveRequests(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      setLoading(false);
      throw error;
    }
  };

  // Fetch pending requests globally (admin only)
  const fetchGlobalLeaveRequests = async () => {
    try {
      setLoading(true);
      const companyId = await getCompanyId()
      const { data, error } = await supabase
        .from("leave_records")
        .select("*")
        .eq("status", "Pending")
        .eq("company_id", companyId)

      if (error) throw error;

      setLeaveRequests(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching global leave requests:", error);
      setLoading(false);
      throw error;
    }
  };

  // Fetch leave history (default: only for user)
  const fetchLeaveHistory = async () => {
    try {
      setLoading(true);
      const user = await getEmployeeInfo();
      const { data, error } = await supabase
        .from("leave_records")
        .select("*")
        .neq("status", "Pending")
        .eq("employee_id", user.id);

      if (error) throw error;

      setLeaveRequests(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching leave history:", error);
      setLoading(false);
      throw error;
    }
  };

  // Fetch leave history globally (admin only)
  const fetchGlobalLeaveHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("leave_records")
        .select("*")
        .neq("status", "Pending");

      if (error) throw error;

      setLeaveRequests(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching global leave history:", error);
      setLoading(false);
      throw error;
    }
  };

  return {
    ...baseResult,
    loading,
    leaveRequests,
    createLeaveRequest,
    updateLeaveRequest,
    fetchLeaveRequests,
    fetchGlobalLeaveRequests,
    fetchLeaveHistory,
    fetchGlobalLeaveHistory,
    processingId: baseResult.updating,
  };
}


// Define the WeeklyHolidayConfig type (adjust fields as needed)
type WeeklyHolidayConfig = {
  id: number;
  company_id: string;
  day_of_week: string;
  is_active: boolean;
};

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
