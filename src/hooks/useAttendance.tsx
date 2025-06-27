"use client";

import { useState } from "react";
import { useBaseEntity } from "./core/useBaseEntity";
import { Attendance } from "@/lib/types";

export type { Attendance };

export function useAttendances() {

  const baseAttendance = useBaseEntity<Attendance>({
    tableName: "attendance_records",
    entityName: "attendance",
    companyScoped: true,
  });


  const [today,setToday] = useState<Attendance>()
  const [todayLoading, setTodayLoading] = useState<boolean>(true)

  baseAttendance.fetchItem

  return baseAttendance
}

// Backward compatibility alias
export const useAttendanceStatus = useAttendances;
