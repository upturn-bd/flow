"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { getCompanyId } from "@/lib/utils/auth";
import { SalaryChangeLog } from "@/lib/types/schemas";

export function useSalaryManagement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Update employee basic salary with audit logging
  const updateEmployeeSalary = useCallback(async (
    employeeId: string,
    newSalary: number,
    reason?: string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const companyId = await getCompanyId();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Get current salary and employee info
      const { data: employee, error: employeeError } = await supabase
        .from("employees")
        .select("basic_salary, first_name, last_name")
        .eq("id", employeeId)
        .single();

      if (employeeError) throw employeeError;
      if (!employee) throw new Error("Employee not found");

      const oldSalary = employee.basic_salary || 0;
      const employeeName = `${employee.first_name} ${employee.last_name}`;

      // Update employee salary
      const { error: updateError } = await supabase
        .from("employees")
        .update({ basic_salary: newSalary })
        .eq("id", employeeId);

      if (updateError) throw updateError;

      // Log the salary change
      const changeLog: Omit<SalaryChangeLog, 'id' | 'created_at'> = {
        employee_id: employeeId,
        company_id: companyId,
        change_data: {
          old_value: oldSalary,
          new_value: newSalary,
          reason: reason || 'Salary updated by admin',
          employee_name: employeeName,
          changed_at: new Date().toISOString()
        },
        changed_by: user.id
      };

      const { error: logError } = await supabase
        .from("salary_change_log")
        .insert([changeLog]);

      if (logError) {
        console.error('Failed to log salary change:', logError);
        // Don't fail the operation if logging fails
      }

      return { success: true, oldSalary, newSalary };
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      throw errorObj;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get salary change history for an employee
  const getSalaryChangeHistory = useCallback(async (employeeId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const companyId = await getCompanyId();
      
      const { data, error } = await supabase
        .from("salary_change_log")
        .select(`
          *,
          changed_by_employee:employees!salary_change_log_changed_by_fkey(first_name, last_name)
        `)
        .eq("employee_id", employeeId)
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      return data || [];
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      throw errorObj;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get all salary changes for company (admin view)
  const getAllSalaryChanges = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const companyId = await getCompanyId();
      
      const { data, error } = await supabase
        .from("salary_change_log")
        .select(`
          *,
          employee:employees!salary_change_log_employee_id_fkey(first_name, last_name),
          changed_by_employee:employees!salary_change_log_changed_by_fkey(first_name, last_name)
        `)
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      return data || [];
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      throw errorObj;
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    loading,
    error,

    // Actions
    updateEmployeeSalary,
    getSalaryChangeHistory,
    getAllSalaryChanges,
    clearError,
  };
}