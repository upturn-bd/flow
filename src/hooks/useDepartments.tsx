"use client";

import { useState, useCallback, useContext } from "react";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "@/lib/api/company-info/departments";
import { AuthContext } from "@/lib/auth/auth-provider";

export type Department = {
  id: number;
  name: string;
  head_id: string;
  description: string;
  division_id: number;
};

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const { employee } = useContext(AuthContext)!;
      console.log("user", employee);
      const data = await getDepartments(employee!.id);
      console.log("data", data);
      setDepartments(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createDepartmentHandler = async (department: Omit<Department, "id">) => {
    const { employee } = useContext(AuthContext)!;
    return await createDepartment(employee!.id, department);
  };

  const updateDepartmentHandler = async (department: Department) => {
    return await updateDepartment(department.id, department);
  };

  const deleteDepartmentHandler = async (id: number) => {
    return await deleteDepartment(id);
  };

  return {
    departments,
    loading,
    fetchDepartments,
    createDepartment: createDepartmentHandler,
    updateDepartment: updateDepartmentHandler,
    deleteDepartment: deleteDepartmentHandler,
  };
}
