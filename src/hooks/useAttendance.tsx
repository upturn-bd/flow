"use client";

import {
  createAttendance as cAttendance,
  deleteAttendance as dAttendance,
  getAttendances,
  updateAttendance as uAttendance,
} from "@/lib/api/operations-and-services/attendance";
import { attendanceSchema } from "@/lib/types";
import { useState, useCallback, useEffect, useContext } from "react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { AuthContext } from "@/lib/auth/auth-provider";

export type Attendance = z.infer<typeof attendanceSchema>;

export function useAttendances() {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAttendances = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAttendances();
      setAttendances(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createAttendance = async (attendance: Attendance) => {
    const data = await cAttendance(attendance);
    return { success: true, status: 200, data };
  };

  const updateAttendance = async (attendance: Attendance) => {
    const data = await uAttendance(attendance);
    return { success: true, status: 200, data };
  };

  const deleteAttendance = async (id: number) => {
    const data = await dAttendance(id);
    return { success: true, status: 200, data };
  };

  return {
    attendances,
    loading,
    fetchAttendances,
    createAttendance,
    updateAttendance,
    deleteAttendance,
  };
}

type AttendanceStatus = {
  checkIn: boolean;
  checkOut: boolean;
};

export function useAttendanceStatus() {
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>({
    checkIn: true,
    checkOut: true,
  });
  const [attendanceDetails, setAttendanceDetails] = useState<Attendance | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const checkAttendanceStatus = async () => {
    const supabase = createClient();
    const { employee } = useContext(AuthContext)!;
    try {
      setLoading(true);

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split("T")[0];

      // Query for today's attendance record
      const { data, error } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("employee_id", employee!.id)
        .eq("company_id", employee!.company_id)
        .eq("attendance_date", today)
        .maybeSingle();

      if (error) throw error;

      // Update status based on database records
      if (data) {
        setAttendanceStatus({
          checkIn: false, // Check-in exists
          checkOut: !data.check_out_time, // Check-out exists or not
        });
        setAttendanceDetails(data);
      } else {
        // No record for today
        setAttendanceStatus({
          checkIn: true,
          checkOut: true,
        });
        setAttendanceDetails(null);
      }
    } catch (error) {
      console.error("Error checking attendance status:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAttendanceStatus();
  }, []);

  return {
    attendanceStatus,
    loading,
    attendanceDetails,
    checkAttendanceStatus,
  };
}
