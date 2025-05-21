"use client";

import {
  createLeaveType as cLeaveType,
  deleteLeaveType as dLeaveType,
  getLeaveTypes,
  updateLeaveType as uLeaveType,
  createHolidayConfig as cHolidayConfig,
  deleteHolidayConfig as dHolidayConfig,
  getHolidayConfigs,
  updateHolidayConfig as uHolidayConfig,

} from "@/lib/api/admin-management/leave";
import { leaveTypeSchema, holidayConfigSchema } from "@/lib/types";
import { useState, useCallback } from "react";
import { z } from "zod";
import { supabase } from "@/lib/supabase/client";
import { getEmployeeInfo } from "@/lib/api/employee";
import { getCompanyId } from "@/lib/api/company/companyInfo";
import { LeaveState } from "@/components/operations-and-services/leave/LeaveCreatePage";

export type LeaveType = z.infer<typeof leaveTypeSchema>;

export function useLeaveTypes() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaveTypes = useCallback(async () => {
    setLoading(true);
    try {
      const company_id = await getCompanyId();
      const { data, error } = await supabase
        .from("leave_types")
        .select("*")
        .eq("company_id", company_id);

      if (error) throw error;
      setLeaveTypes(data || []);
      return data;
    } catch (error) {
      setError("Failed to fetch leave types");
      console.error(error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createLeaveType = useCallback(async (values: LeaveType) => {
    try {
      const company_id = await getCompanyId();
      const { data, error } = await supabase
        .from("leave_types")
        .insert({
          ...values,
          company_id,
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }, []);

  const updateLeaveType = async (leaveType: LeaveType) => {
    const data = await uLeaveType(leaveType);
    return { success: true, status: 200, data };
  };

  const deleteLeaveType = async (id: number) => {
    const data = await dLeaveType(id);
    return { success: true, status: 200, data };
  };

  return {
    leaveTypes,
    loading,
    error,
    fetchLeaveTypes,
    createLeaveType,
    updateLeaveType,
    deleteLeaveType,
  };
}

export type HolidayConfig = z.infer<typeof holidayConfigSchema>;

export function useHolidayConfigs() {
  const [holidayConfigs, setHolidayConfigs] = useState<HolidayConfig[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHolidayConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getHolidayConfigs();
      setHolidayConfigs(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createHolidayConfig = async (config: HolidayConfig) => {
    const data = await cHolidayConfig(config);
    return { success: true, status: 200, data };
  };

  const updateHolidayConfig = async (config: HolidayConfig) => {
    const data = await uHolidayConfig(config);
    return { success: true, status: 200, data };
  };

  const deleteHolidayConfig = async (id: number) => {
    const data = await dHolidayConfig(id);
    return { success: true, status: 200, data };
  };

  return {
    holidayConfigs,
    loading,
    fetchHolidayConfigs,
    createHolidayConfig,
    updateHolidayConfig,
    deleteHolidayConfig,
  };
}

export function useLeaveRequests() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveState[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchLeaveRequests = useCallback(async (status: string = "Pending") => {
    setLoading(true);
    
    try {
      const user = await getEmployeeInfo();
      const company_id = await getCompanyId();
      
      const { data, error } = await supabase
        .from("leave_records")
        .select("*")
        .eq("company_id", company_id)
        .eq("requested_to", user.id)
        .eq("status", status);

      if (error) {
        setError("Failed to fetch leave requests");
        throw error;
      }

      setLeaveRequests(data || []);
      return data;
    } catch (error) {
      setError("Failed to fetch leave requests");
      console.error(error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLeaveHistory = useCallback(async () => {
    return fetchLeaveRequests("Pending");
  }, [fetchLeaveRequests]);

  const updateLeaveRequest = useCallback(async (action: string, id: number, comment: string) => {
    setProcessingId(id);
    
    try {
      const user = await getEmployeeInfo();
      const company_id = await getCompanyId();
      
      const { data, error } = await supabase
        .from("leave_records")
        .update({
          status: action,
          approved_by_id: user.id,
          remarks: comment,
        })
        .eq("company_id", company_id)
        .eq("id", id);
      
      if (error) {
        setError("Failed to update leave request");
        throw error;
      }
      
      // Refresh the requests
      await fetchLeaveRequests();
      return true;
    } catch (error) {
      setError("Failed to update leave request");
      console.error(error);
      return false;
    } finally {
      setProcessingId(null);
    }
  }, [fetchLeaveRequests]);

  return {
    leaveRequests,
    loading,
    error,
    processingId,
    fetchLeaveRequests,
    fetchLeaveHistory,
    updateLeaveRequest
  };
}
