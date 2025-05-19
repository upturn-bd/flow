"use client";

import { useState, useCallback } from "react";
import { getEmployees as getEmployeesApi } from "@/lib/api/company-info/employees";
import { getUserInfo } from "@/lib/api/company-info/employees"
import { z } from "zod";

const employeeSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
});

export type Employee = z.infer<typeof employeeSchema>;

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const user = await getUserInfo();
      const data = await getEmployeesApi(user.id);
      setEmployees(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    employees,
    loading,
    fetchEmployees,
  };
}
