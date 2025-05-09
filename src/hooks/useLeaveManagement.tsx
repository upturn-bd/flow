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

export type LeaveType = z.infer<typeof leaveTypeSchema>;

export function useLeaveTypes() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLeaveTypes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLeaveTypes();
      setLeaveTypes(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createLeaveType = async (leaveType: LeaveType) => {
    const data = await cLeaveType(leaveType);
    return { success: true, status: 200, data };
  };

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
