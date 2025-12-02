"use client";

import { useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { Employee } from "@/lib/types/schemas";
import { captureSupabaseError } from "@/lib/sentry";

export interface ExtendedEmployee extends Employee {
  role?: string;
  phone?: string;
  joinDate?: string;
  basic_salary?: number;
}

export function useEmployees() {
  const { employeeInfo } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [extendedEmployees, setExtendedEmployees] = useState<ExtendedEmployee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchEmployees = useCallback(async (company_id?: number) => {
    setLoading(true);
    setError(null);
    const companyId = company_id ?? employeeInfo?.company_id;
    try {
      if (!companyId) {
        setLoading(false);
        return [];
      }

      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, email, designation, department_id(name)")
        .eq("company_id", companyId)
        .eq("job_status", 'Active');

      if (error) throw error;

      const employees: Employee[] = data?.map((employee) => ({
        id: employee.id,
        name: `${employee.first_name} ${employee.last_name}`,
        email: employee.email,
        designation: employee.designation || undefined,
        department: (employee.department_id as unknown as { name: string })?.name || undefined
      })) || [];

      setEmployees(employees);
      return employees;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      captureSupabaseError(
        { message: errorObj.message },
        "fetchEmployees",
        { companyId }
      );
      console.error("Error fetching employees:", errorObj);
      return [];
    } finally {
      setLoading(false);
    }
  }, [employeeInfo?.company_id]);

  const fetchExtendedEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const companyId = employeeInfo?.company_id;
      if (!companyId) {
        setLoading(false);
        return [];
      }

      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, email, phone_number, department_id(name), designation, hire_date, basic_salary")
        .eq("company_id", companyId);

      if (error) throw error;

      const employees: ExtendedEmployee[] = data?.map((employee) => ({
        id: employee.id,
        name: `${employee.first_name} ${employee.last_name}`,
        email: employee.email,
        designation: employee.designation || undefined,
        department: (employee.department_id as unknown as { name: string })?.name || undefined,
        phone: employee.phone_number,
        joinDate: employee.hire_date,
        basic_salary: employee.basic_salary,
      })) || [];

      setExtendedEmployees(employees);
      return employees;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      captureSupabaseError(
        { message: errorObj.message },
        "fetchExtendedEmployees",
        { companyId: employeeInfo?.company_id }
      );
      console.error("Error fetching employees:", errorObj);
      return [];
    } finally {
      setLoading(false);
    }
  }, [employeeInfo?.company_id]);

  /**
   * Fetch employees by specific IDs - use this to avoid N+1 queries
   * when you only need to display names for specific employees
   */
  const fetchEmployeesByIds = useCallback(async (ids: string[]) => {
    if (!ids || ids.length === 0) {
      return [];
    }

    // Filter out null/undefined and deduplicate
    const uniqueIds = [...new Set(ids.filter(Boolean))];
    if (uniqueIds.length === 0) {
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, email, designation, department_id(name)")
        .in("id", uniqueIds);

      if (error) throw error;

      const fetchedEmployees: Employee[] = data?.map((employee) => ({
        id: employee.id,
        name: `${employee.first_name} ${employee.last_name}`,
        email: employee.email,
        designation: employee.designation || undefined,
        department: (employee.department_id as unknown as { name: string })?.name || undefined
      })) || [];

      // Merge with existing employees to avoid losing data
      setEmployees((prev) => {
        const existingIds = new Set(prev.map((e) => e.id));
        const newEmployees = fetchedEmployees.filter((e) => !existingIds.has(e.id));
        return [...prev, ...newEmployees];
      });

      return fetchedEmployees;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      captureSupabaseError(
        { message: errorObj.message },
        "fetchEmployeesByIds",
        { ids: uniqueIds }
      );
      console.error("Error fetching employees by IDs:", errorObj);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return useMemo(() => ({
    employees,
    extendedEmployees,
    loading,
    error,
    fetchEmployees,
    fetchExtendedEmployees,
    fetchEmployeesByIds,
  }), [employees, extendedEmployees, loading, error, fetchEmployees, fetchExtendedEmployees, fetchEmployeesByIds]);
}
