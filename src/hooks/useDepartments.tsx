"use client";

import { useCallback, useMemo, useState, useRef } from "react";
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
  
  // Use ref to store the fetch function to avoid circular dependency
  const fetchDepartmentsRef = useRef<(company_id?: number) => Promise<Department[]>>();

  // Manual fetch all departments
  const fetchDepartments = useCallback(async (company_id?: number | undefined) => {
    try {
      setLoading(true);
      const supabase = await createClient();
      const companyId = company_id ?? employeeInfo?.company_id;
      if (!companyId) {
        setDepartments([]);
        setLoading(false);
        return [];
      }

      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .eq("company_id", companyId);

      if (error) throw error;

      setDepartments(data || []);
      setLoading(false);

      return data || [];
    } catch (error) {
      console.error("Error fetching departments:", error);
      setDepartments([]);
      setLoading(false);
      throw error;
    }
  }, [employeeInfo?.company_id]);

  // Store the fetch function in ref for use in other callbacks
  fetchDepartmentsRef.current = fetchDepartments;

  // Manual create department
  const createDepartment = useCallback(async (dept: Department) => {
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

      fetchDepartmentsRef.current?.();
      setLoading(false);

      return data;
    } catch (error) {
      console.error("Error creating department:", error);
      setLoading(false);
      throw error;
    }
  }, [authLoading, user, employeeInfo?.company_id]);

  // Manual update department
  const updateDepartment = useCallback(async (id: number, dept: Partial<Department>) => {
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

      fetchDepartmentsRef.current?.()
      setLoading(false)

      return data;
    } catch (error) {
      console.error("Error updating department:", error);
      throw error;
    }
  }, [authLoading, user]);

  // Manual delete department
  const deleteDepartment = useCallback(async (id: number) => {
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

      fetchDepartmentsRef.current?.()
      setLoading(false)

      return data;
    } catch (error) {
      console.error("Error deleting department:", error);
      throw error;
    }
  }, [authLoading, user]);

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
