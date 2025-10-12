"use client";

import { useState, useCallback } from "react";
import { useBaseEntity } from "./core/useBaseEntity";
import { Attendance } from "@/lib/types";
import { set } from "react-hook-form";

export type { Attendance };

export function useAttendances() {
  const baseAttendance = useBaseEntity<Attendance>({
    tableName: "attendance_records",
    entityName: "attendance",
    companyScoped: true,
  });

  const [today, setToday] = useState<Attendance | null>(null);
  const [todayLoading, setTodayLoading] = useState<boolean>(false);

  // Get attendance for a specific date
  const getAttendanceForDate = useCallback(async (date: string, employeeId?: string): Promise<Attendance | null> => {
    setTodayLoading(true);
    try {
      const filters: any = {
        eq: {
          attendance_date: date, // using correct field name
        }
      };

      // If employeeId is provided, add it to filters
      if (employeeId) {
        filters.eq.employee_id = employeeId;
      }

      const result = await baseAttendance.fetchSingleWithQuery({
        filters,
      });

      console.log(result);
      
      setToday(result);
      setTodayLoading(false);
      return result;
    } catch (error) {
      console.error('Error fetching attendance for date:', error);
      setTodayLoading(false);
      return null;
    }
  }, [baseAttendance]);

  // Get today's attendance
  const getTodaysAttendance = useCallback(async (employeeId?: string): Promise<Attendance | null> => {
    setTodayLoading(true);
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toLocaleDateString('sv-SE'); // Get YYYY-MM-DD format
    const attendance = await getAttendanceForDate(today, employeeId);
        setToday(attendance)

    setTodayLoading(false);
    return attendance;
  }, [getAttendanceForDate]);

  // Get attendance for a date range
  const getAttendanceForDateRange = useCallback(async (
    startDate: string, 
    endDate: string, 
    employeeId?: string
  ): Promise<Attendance[]> => {
    try {
      const filters: any = {
        gte: { attendance_date: startDate },
        lte: { attendance_date: endDate }
      };

      if (employeeId) {
        filters.eq = { employee_id: employeeId };
      }

      const result = await baseAttendance.fetchItemsWithQuery({
        filters,
        options: {
          orderBy: [{ column: 'attendance_date', ascending: true }]
        }
      });

      return result;
    } catch (error) {
      console.error('Error fetching attendance for date range:', error);
      return [];
    }
  }, [baseAttendance]);

  // Get attendance by tag (status)
  const getAttendanceByTag = useCallback(async (
    tag: string,
    startDate?: string,
    endDate?: string
  ): Promise<Attendance[]> => {
    try {
      const filters: any = {
        eq: { tag }
      };

      if (startDate && endDate) {
        filters.gte = { attendance_date: startDate };
        filters.lte = { attendance_date: endDate };
      }

      const result = await baseAttendance.fetchItemsWithQuery({
        filters,
        options: {
          orderBy: [{ column: 'attendance_date', ascending: false }]
        }
      });

      return result;
    } catch (error) {
      console.error('Error fetching attendance by tag:', error);
      return [];
    }
  }, [baseAttendance]);

  return {
    ...baseAttendance,
    today,
    todayLoading,
    getAttendanceForDate,
    getTodaysAttendance,
    getAttendanceForDateRange,
    getAttendanceByTag,
    deleteAttendance: baseAttendance.deleteItem,
    updateAttendance: baseAttendance.updateItem
  };
}

// Backward compatibility alias
export const useAttendanceStatus = useAttendances;
