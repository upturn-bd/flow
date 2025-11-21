"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { JOB_STATUS } from "@/lib/constants";

export interface OffboardingEmployee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  department_id: number;
  designation: string;
  job_status: string;
  hire_date: string;
  supervisor_id: string;
  department_name?: string;
  supervisor_name?: string;
}

export interface OffboardingData {
  employee_id: string;
  offboarding_date: string;
  reason: string;
  offboarding_type: 'Resigned' | 'Terminated';
  notes?: string;
}

export function useOffboarding() {
  const { employeeInfo } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeEmployees, setActiveEmployees] = useState<OffboardingEmployee[]>([]);
  const [offboardedEmployees, setOffboardedEmployees] = useState<OffboardingEmployee[]>([]);

  // Clear error helper
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch active employees (eligible for offboarding)
  const fetchActiveEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const companyId = employeeInfo?.company_id;
      if (!companyId) {
        setLoading(false);
        return [];
      }

      const { data, error: fetchError } = await supabase
        .from("employees")
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone_number,
          department_id,
          designation,
          job_status,
          hire_date,
          supervisor_id,
          departments!employees_department_id_fkey(name)
        `)
        .eq("company_id", companyId)
        .eq("job_status", JOB_STATUS.ACTIVE)
        .order("first_name", { ascending: true });

      if (fetchError) throw fetchError;

      // Fetch supervisor names
      const employeesWithDetails = await Promise.all(
        (data || []).map(async (emp: any) => {
          let supervisor_name = "Not assigned";
          
          if (emp.supervisor_id) {
            const { data: supervisorData } = await supabase
              .from("employees")
              .select("first_name, last_name")
              .eq("id", emp.supervisor_id)
              .single();
            
            if (supervisorData) {
              supervisor_name = `${supervisorData.first_name} ${supervisorData.last_name}`;
            }
          }

          return {
            ...emp,
            department_name: emp.departments?.name || "No department",
            supervisor_name,
          };
        })
      );

      setActiveEmployees(employeesWithDetails);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching active employees:", err);
    } finally {
      setLoading(false);
    }
  }, [employeeInfo?.company_id]);

  // Fetch offboarded employees
  const fetchOffboardedEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const companyId = employeeInfo?.company_id;
      if (!companyId) {
        setLoading(false);
        return [];
      }

      const { data, error: fetchError } = await supabase
        .from("employees")
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone_number,
          department_id,
          designation,
          job_status,
          hire_date,
          supervisor_id,
          departments!employees_department_id_fkey(name)
        `)
        .eq("company_id", companyId)
        .in("job_status", [JOB_STATUS.RESIGNED, JOB_STATUS.TERMINATED])
        .order("first_name", { ascending: true });

      if (fetchError) throw fetchError;

      // Fetch supervisor names
      const employeesWithDetails = await Promise.all(
        (data || []).map(async (emp: any) => {
          let supervisor_name = "Not assigned";
          
          if (emp.supervisor_id) {
            const { data: supervisorData } = await supabase
              .from("employees")
              .select("first_name, last_name")
              .eq("id", emp.supervisor_id)
              .single();
            
            if (supervisorData) {
              supervisor_name = `${supervisorData.first_name} ${supervisorData.last_name}`;
            }
          }

          return {
            ...emp,
            department_name: emp.departments?.name || "No department",
            supervisor_name,
          };
        })
      );

      setOffboardedEmployees(employeesWithDetails);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching offboarded employees:", err);
    } finally {
      setLoading(false);
    }
  }, [employeeInfo?.company_id]);

  // Process offboarding
  const processOffboarding = useCallback(
    async (data: OffboardingData) => {
      setLoading(true);
      setError(null);

      try {
        // Update employee job status
        const { error: updateError } = await supabase
          .from("employees")
          .update({
            job_status: data.offboarding_type,
          })
          .eq("id", data.employee_id);

        if (updateError) throw updateError;

        // You could also create an offboarding record in a separate table
        // const { error: recordError } = await supabase
        //   .from("offboarding_records")
        //   .insert({
        //     employee_id: data.employee_id,
        //     offboarding_date: data.offboarding_date,
        //     reason: data.reason,
        //     offboarding_type: data.offboarding_type,
        //     notes: data.notes,
        //   });
        // if (recordError) throw recordError;

        // Refresh the lists
        await fetchActiveEmployees();
        await fetchOffboardedEmployees();

        return {
          success: true,
          message: `Employee successfully ${data.offboarding_type === 'Resigned' ? 'resigned' : 'terminated'}`,
        };
      } catch (err: any) {
        setError(err.message);
        console.error("Error processing offboarding:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchActiveEmployees, fetchOffboardedEmployees]
  );

  // Reactivate employee
  const reactivateEmployee = useCallback(
    async (employee_id: string) => {
      setLoading(true);
      setError(null);

      try {
        const { error: updateError } = await supabase
          .from("employees")
          .update({
            job_status: JOB_STATUS.ACTIVE,
          })
          .eq("id", employee_id);

        if (updateError) throw updateError;

        // Refresh the lists
        await fetchActiveEmployees();
        await fetchOffboardedEmployees();

        return {
          success: true,
          message: "Employee successfully reactivated",
        };
      } catch (err: any) {
        setError(err.message);
        console.error("Error reactivating employee:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchActiveEmployees, fetchOffboardedEmployees]
  );

  return {
    loading,
    error,
    activeEmployees,
    offboardedEmployees,
    fetchActiveEmployees,
    fetchOffboardedEmployees,
    processOffboarding,
    reactivateEmployee,
    clearError,
  };
}
