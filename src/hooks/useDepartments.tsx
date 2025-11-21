"use client";

import { useEffect, useMemo, useState } from "react";
import { useBaseEntity } from "./core";
import { Department } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";

export type { Department };

export function useDepartments() {
  const { user, isLoading: authLoading, employeeInfo } = useAuth();
  const baseResult = useBaseEntity<Department>({
    tableName: "departments",
    entityName: "department",
    companyScoped: true,
  });

  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(false)

  // Manual fetch all departments
  const fetchDepartments = async (company_id?: number | undefined) => {
    // Don't fetch if auth is still loading or user isn't authenticated
    if (authLoading || !user) {
      return [];
    }

    try {
      const supabase = await createClient();
      const companyId = company_id ?? employeeInfo?.company_id;
      if (!companyId) {
        return [];
      }

      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .eq("company_id", companyId);

      if (error) throw error;

      setDepartments(data)

      return data || [];
    } catch (error) {
      console.error("Error fetching departments:", error);
      throw error;
    }
  };

  // Manual create department
  // Manual create department
  const createDepartment = async (dept: Department) => {
    if (authLoading || !user) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);
      const supabase = await createClient();
      const companyId = employeeInfo?.company_id;
      if (!companyId) {
        throw new Error('Company ID not available');
      }

      // Remove `id` before inserting
      const { id, ...insertData } = dept;

      insertData.company_id = companyId;


      const { data, error } = await supabase
        .from("departments")
        .insert([insertData]) // <-- id is not included
        .select()
        .single();

      if (error) throw error;

      // update head employee if head_id exists
      if (data?.head_id) {
        await supabase
          .from("employees")
          .update({ department_id: data.id })
          .eq("id", data.head_id);
      }

      fetchDepartments();
      setLoading(false);

      return data;
    } catch (error) {
      console.error("Error creating department:", error);
      setLoading(false);
      throw error;
    }
  };

  // Manual update department
  const updateDepartment = async (id: number, dept: Partial<Department>) => {
    if (authLoading || !user) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true)

      const supabase = await createClient();

      const { data, error } = await supabase
        .from("departments")
        .update(dept)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // update head employee if head_id exists
      if (dept.head_id) {
        await supabase
          .from("employees")
          .update({ department_id: id })
          .eq("id", dept.head_id);
      }

      fetchDepartments()
      setLoading(false)

      return data;
    } catch (error) {
      console.error("Error updating department:", error);
      throw error;
    }
  };

  // Manual delete department
  const deleteDepartment = async (id: number) => {
    if (authLoading || !user) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true)

      const supabase = await createClient();

      // remove department from employees first
      await supabase
        .from("employees")
        .update({ department_id: null })
        .eq("department_id", id);

      const { data, error } = await supabase
        .from("departments")
        .delete()
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      fetchDepartments()
      setLoading(false)

      return data;
    } catch (error) {
      console.error("Error deleting department:", error);
      throw error;
    }
  };

  return {
    ...baseResult,
    loading,
    departments,
    department: baseResult.item,
    fetchDepartment: baseResult.fetchItem,
    fetchDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
  }
}
