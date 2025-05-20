"use client";

import { getCompanyId } from "@/lib/auth/getUser";
import { supabase } from "@/lib/supabase/client";
import { useState, useCallback } from "react";
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
    const client = createClient();
    const company_id = await getCompanyId();
    try {
      const res = await client
        .from("employees")
        .select("id, first_name, last_name, role, email, phone_number")
        .eq("company_id", company_id);
      const formattedData = res.data?.map((employee) => ({
        id: employee.id,
        name: `${employee.first_name} ${employee.last_name}`,
        role: employee.role,
        email: employee.email,
        phone: employee.phone_number,
      })) || [];
      setEmployees(formattedData);
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
