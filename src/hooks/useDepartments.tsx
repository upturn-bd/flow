"use client";

import { useState, useCallback } from "react";

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
      const res = await fetch("/api/company-info/departments");
      const data = await res.json();
      setDepartments(data.departments || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createDepartment = async (department: Omit<Department, "id">) => {
    const res = await fetch("/api/company-info/departments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(department),
    });
    return await res.json();
  };

  const updateDepartment = async (department: Department) => {
    const res = await fetch("/api/company-info/departments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(department),
    });
    return await res.json();
  };

  const deleteDepartment = async (id: number) => {
    const res = await fetch(`/api/company-info/departments?id=${id}`, {
      method: "DELETE",
    });
    return await res.json();
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
