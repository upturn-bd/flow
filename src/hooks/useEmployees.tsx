"use client";

import { getCompanyId } from "@/lib/auth/getUser";
import { supabase } from "@/lib/supabase/client";
import { useState, useCallback } from "react";
import { unknown, z } from "zod";

const employeeSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  email: z.string(),
  phone: z.string(),
  designation: z.string(),
  joinDate: z.string(),
});

export type Employee = z.infer<typeof employeeSchema>;

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    const company_id = await getCompanyId();
    try {
      const res = await supabase
        .from("employees")
        .select(
          `id, first_name, last_name, role, email, phone_number, designation, hire_date, department_id(name)`
        )
        .eq("company_id", company_id);
      const formattedData =
        res.data?.map((employee) => {
          const department = (employee.department_id as unknown as {name:string})?.name;
          return {
            id: employee.id,
            name: `${employee.first_name} ${employee.last_name}`,
            role: employee.role,
            email: employee.email,
            phone: employee.phone_number,
            designation: employee.designation,
            joinDate: employee.hire_date,
            department: department,
          };
        }) || [];
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
