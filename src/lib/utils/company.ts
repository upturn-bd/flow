/**
 * Company validation utilities
 * Functions for validating company information
 */

import { supabase } from "@/lib/supabase/client";
import { getCompanyId, getCompanyInfo, getEmployeeId } from "./auth";

/**
 * Validate company code and name combination
 */
export async function validateCompanyCode(name: string, code: string) {
  const { data, error } = await supabase
    .from('companies')
    .select('id, name')
    .eq('code', code)
    .eq('name', name)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return { 
    exists: !!data,
    isValid: !!data,
    id: data?.id || null,
    name: data?.name || null
  };
}

export async function getDepartmentIds () {
  const companyId = await getCompanyId();
  const { data, error } = await supabase
    .from('departments')
    .select('id')
    .eq('company_id', companyId);
  if (error) {
    console.error("Error fetching department IDs:", error);
    return [];
  }
  return data?.map(dept => dept.id) || [];
}

export async function getDepartmentEmployeesIds(department_id: number) {
  const companyId = await getCompanyId();

  let query = supabase
    .from("employees")
    .select("id")
    .eq("company_id", companyId);

  if (department_id !== 0) {
    query = query.eq("department_id", department_id);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching department employees:", error);
    return [];
  }

  return data?.map((emp) => emp.id) || [];
}

