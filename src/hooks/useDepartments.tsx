"use client";

import { useState, useCallback } from "react";
import {
  getDepartments as fetchDepartmentsApi,
  createDepartment as createDepartmentApi,
  updateDepartment as updateDepartmentApi,
  deleteDepartment as deleteDepartmentApi
} from "@/lib/api/company/departments";

// Define Department type that matches both API and UI needs
export type Department = {
  id: number;
  name: string;
  head_id?: string;
  description?: string;
  division_id?: number;
  company_id?: string | number;
  created_at?: string;
};

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDepartments = useCallback(async (company_id?: number) => {
    setLoading(true);
    try {
      const data = await fetchDepartmentsApi(company_id);
      setDepartments(data as Department[]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createDepartment = async (department: Omit<Department, "id" | "company_id" | "created_at">) => {
    try {
      const data = await createDepartmentApi(department);
      await fetchDepartments(); // Refresh list after creating
      return { success: true, data };
    } catch (error) {
      console.error(error);
      return { success: false, error };
    }
  };

  const updateDepartment = async (department: Department) => {
    try {
      await updateDepartmentApi(department);
      await fetchDepartments(); // Refresh list after updating
      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false, error };
    }
  };

  const deleteDepartment = async (id: number) => {
    try {
      await deleteDepartmentApi(id);
      await fetchDepartments(); // Refresh list after deleting
      return { success: true, message: "Department deleted successfully." };
    } catch (error) {
      console.error(error);
      return { success: false, error };
    }
  };

  return {
    departments,
    loading,
    fetchDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
  };
}
