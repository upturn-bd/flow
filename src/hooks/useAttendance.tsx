"use client";

import { useBaseEntity } from "./core/useBaseEntity";
import { Attendance } from "@/lib/types";

export type { Attendance };

export function useAttendances() {
  return useBaseEntity<Attendance>({
    tableName: "attendance_records",
    entityName: "attendance",
    companyScoped: true,
  });
}

// Backward compatibility alias
export const useAttendanceStatus = useAttendances;
