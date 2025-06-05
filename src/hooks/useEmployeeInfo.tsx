"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { getCompanyId } from "@/lib/api/company/companyInfo";

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
      const company_id = await getCompanyId();

      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name")
        .eq("company_id", company_id);

      if (error) throw error;

      const employees = data?.map((employee) => ({
        id: employee.id,
        name: `${employee.first_name} ${employee.last_name}`,
      })) || [];

      setEmployees(employees);
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