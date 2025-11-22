"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { DatabaseError } from "@/lib/utils/auth";
import { Employee } from "@/lib/types/schemas";

export function useEmployeeInfo() {
  const { employeeInfo } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployeeInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const companyId = employeeInfo?.company_id;
      if (!companyId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, email, designation, department_id(name)")
        .eq("company_id", companyId);

      if (error) {
        throw new DatabaseError(`Failed to fetch employee info: ${error.message}`);
      }

      const employees = data?.map((employee) => ({
        id: employee.id,
        name: `${employee.first_name} ${employee.last_name}`,
        email: employee.email,
        designation: employee.designation || undefined,
        department: (employee.department_id as unknown as { name: string })?.name || undefined
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