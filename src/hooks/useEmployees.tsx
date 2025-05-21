"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { getEmployeesInfo as getEmployeesInfoApi } from "@/lib/api/admin-management/inventory";

interface Employee {
  id: string;
  name: string;
  role?: string;
}

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getEmployeesInfoApi();
      if (response?.data) {
        setEmployees(response.data);
        return response.data;
      }
      return [];
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      console.error("Error fetching employees:", errorObj);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    employees,
    loading,
    error,
    fetchEmployees
  };
}
