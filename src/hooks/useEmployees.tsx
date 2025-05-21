"use client";

import { useState, useCallback } from "react";
import { getEmployeesInfo, getExtendedEmployeesInfo } from "@/lib/api/admin-management/inventory";

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
}

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [extendedEmployees, setExtendedEmployees] = useState<ExtendedEmployee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getEmployeesInfo();
      if (response?.data) {
        setEmployees(response.data);
        return response.data;
      }
      return [];
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
      const response = await getExtendedEmployeesInfo();
      if (response?.data) {
        setExtendedEmployees(response.data);
        return response.data;
      }
      return [];
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      console.error("Error fetching employees:", errorObj);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    employees,
    extendedEmployees,
    loading,
    error,
    fetchEmployees,
    fetchExtendedEmployees
  };
}
