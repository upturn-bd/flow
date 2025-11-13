"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { DatabaseError } from "@/lib/utils/auth";

// Define type for employee info
export type EmployeeInfo = {
  id: string;
  name: string;
  department_id: number;
};

export function useEmployeeInfo() {
  const { employeeInfo } = useAuth();
  const [employees, setEmployees] = useState<EmployeeInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployeeInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const companyId = employeeInfo?.company_id;
      if (!companyId) {
        throw new DatabaseError('Company ID not available');
      }

      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, department_id")
        .eq("company_id", companyId);

      if (error) {
        throw new DatabaseError(`Failed to fetch employee info: ${error.message}`);
      }

      const employees = data?.map((employee) => ({
        id: employee.id,
        name: `${employee.first_name} ${employee.last_name}`,
        department_id: employee.department_id
      })) || [];

      setEmployees(employees);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch employee info";
      console.error("Error fetching employee info:", err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [employeeInfo?.company_id]);

  return {
    employees,
    loading,
    error,
    fetchEmployeeInfo
  };
} 