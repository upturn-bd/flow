"use client";

import { Attendance } from "@/lib/types";
import { validateAttendance } from "@/lib/utils/validation";
import { useState, useCallback, useEffect } from "react";
import { getEmployeeInfo } from "@/lib/api/employee";
import { supabase } from "@/lib/supabase/client";
import { getCompanyId } from "@/lib/api/company/companyInfo";

// Re-export Attendance type for components
export type { Attendance };

export function useAttendances() {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAttendances = useCallback(async () => {
    setLoading(true);
    try {
      const company_id = await getCompanyId();

      const { data, error } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("company_id", company_id);

      if (error) throw error;
      setAttendances(data || []);
      return data;
    } catch (error) {
      console.error(error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createAttendance = useCallback(async (values: Attendance) => {
    try {
      const company_id = await getCompanyId();
      
      // Validate the payload
      const validation = validateAttendance(values);
      if (!validation.success) {
        const error = new Error("Validation failed");
        (error as any).issues = validation.errors;
        throw error;
      }

      const { data, error } = await supabase
        .from("attendance_records")
        .insert({
          ...values,
          company_id,
        });

      if (error) throw error;
      return { success: true, status: 200, data };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }, []);

  const updateAttendance = useCallback(async (values: Attendance) => {
    try {
      const company_id = await getCompanyId();
      
      // Validate the payload
      const validation = validateAttendance(values);
      if (!validation.success) {
        const error = new Error("Validation failed");
        (error as any).issues = validation.errors;
        throw error;
      }

      const { data, error } = await supabase
        .from("attendance_records")
        .update(values)
        .eq("id", values.id)
        .eq("company_id", company_id);

      if (error) throw error;
      return { success: true, status: 200, data };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }, []);

  const deleteAttendance = useCallback(async (id: number) => {
    try {
      const company_id = await getCompanyId();

      const { error } = await supabase
        .from("attendance_records")
        .delete()
        .eq("id", id)
        .eq("company_id", company_id);

      if (error) throw error;
      return { success: true, status: 200, data: null };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }, []);

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
    
    const user = await getEmployeeInfo();
    try {
      setLoading(true);

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split("T")[0];

      // Query for today's attendance record
      const { data, error } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("employee_id", user.id)
        .eq("company_id", user.company_id)
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
