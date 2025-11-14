"use client";

import { useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import { getCompanyId } from "@/lib/utils/auth";
import { JOB_STATUS } from "@/lib/constants";

export interface Employee {
  id: string;
  name: string;
  role?: string;
}

export interface ExtendedEmployee extends Employee {
  email?: string;
  phone?: string;
  department?: string;
  designation?: string;
  joinDate?: string;
  basic_salary?: number;
}

export interface EmployeeSearchOptions {
  searchQuery?: string;
  page?: number;
  pageSize?: number;
}

export interface EmployeeSearchResult {
  employees: ExtendedEmployee[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [extendedEmployees, setExtendedEmployees] = useState<ExtendedEmployee[]>([]);
  const [searchResult, setSearchResult] = useState<EmployeeSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchEmployees = useCallback(async (company_id?: number) => {
    setLoading(true);
    setError(null);
    try {
      if(company_id === undefined) {
        company_id = await getCompanyId();
      }

      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, job_status")
        .eq("company_id", company_id)
        .eq("job_status", JOB_STATUS.ACTIVE);

      if (error) throw error;

      const employees = data?.map((employee) => ({
        id: employee.id,
        name: `${employee.first_name} ${employee.last_name}`,
      })) || [];

      setEmployees(employees);
      return employees;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      console.error("Error fetching employees:", errorObj);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchExtendedEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const company_id = await getCompanyId();

      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, email, phone_number, department_id(name), designation, hire_date, basic_salary, job_status")
        .eq("company_id", company_id)
        .eq("job_status", JOB_STATUS.ACTIVE);

      if (error) throw error;

      const employees: ExtendedEmployee[] = data?.map((employee) => ({
        id: employee.id,
        name: `${employee.first_name} ${employee.last_name}`,
        email: employee.email,
        phone: employee.phone_number,
        department: (employee.department_id as unknown as { name: string })?.name,
        designation: employee.designation,
        joinDate: employee.hire_date,
        basic_salary: employee.basic_salary,
      })) || [];

      setExtendedEmployees(employees);
      return employees;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      console.error("Error fetching employees:", errorObj);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // New method for role management with pagination and search
  const searchEmployeesForRoleManagement = useCallback(async (options: EmployeeSearchOptions = {}) => {
    const { searchQuery = "", page = 1, pageSize = 25 } = options;
    
    setLoading(true);
    setError(null);
    
    try {
      const company_id = await getCompanyId();
      
      // Build query
      let query = supabase
        .from("employees")
        .select("id, first_name, last_name, email, role, job_status", { count: 'exact' })
        .eq("company_id", company_id)
        .eq("job_status", JOB_STATUS.ACTIVE);
      
      // Add search filter if provided
      if (searchQuery.trim()) {
        const searchTerm = `%${searchQuery.trim()}%`;
        query = query.or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm}`);
      }
      
      // Add pagination
      const startIndex = (page - 1) * pageSize;
      query = query.range(startIndex, startIndex + pageSize - 1);
      
      // Order by name for consistent results
      query = query.order('first_name').order('last_name');
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      const employees: ExtendedEmployee[] = data?.map((employee) => ({
        id: employee.id,
        name: `${employee.first_name} ${employee.last_name}`,
        email: employee.email,
        role: employee.role,
      })) || [];
      
      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);
      
      const result: EmployeeSearchResult = {
        employees,
        totalCount,
        totalPages,
        currentPage: page,
      };
      
      setSearchResult(result);
      return result;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      console.error("Error searching employees for role management:", errorObj);
      return {
        employees: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: page,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Method to update employee role
  const updateEmployeeRole = useCallback(async (employeeId: string, newRole: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const company_id = await getCompanyId();
      
      const { error } = await supabase
        .from("employees")
        .update({ role: newRole })
        .eq("id", employeeId)
        .eq("company_id", company_id);
      
      if (error) throw error;
      
      return true;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      console.error("Error updating employee role:", errorObj);
      throw errorObj;
    } finally {
      setLoading(false);
    }
  }, []);

  return useMemo(() => ({
    employees,
    extendedEmployees,
    searchResult,
    loading,
    error,
    fetchEmployees,
    fetchExtendedEmployees,
    searchEmployeesForRoleManagement,
    updateEmployeeRole
  }), [employees, extendedEmployees, searchResult, loading, error, fetchEmployees, fetchExtendedEmployees, searchEmployeesForRoleManagement, updateEmployeeRole]);
}
