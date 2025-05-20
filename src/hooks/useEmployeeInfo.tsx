"use client";

import { useState, useCallback } from "react";
import { getEmployeesInfo } from "@/lib/api/admin-management/inventory";

// Define type for employee info
export type EmployeeInfo = {
  id: string;
  name: string;
};

export function useEmployeeInfo() {
  const [employees, setEmployees] = useState<EmployeeInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchEmployeeInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getEmployeesInfo();
      setEmployees(data || []);
    } catch (err) {
      console.error("Error fetching employee info:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    employees,
    loading,
    error,
    fetchEmployeeInfo
  };
} 