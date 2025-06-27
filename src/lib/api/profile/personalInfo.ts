/**
 * Personal Info API functions
 * Handles employee personal information management
 */

import { supabase } from "@/lib/supabase/client";
import { getEmployeeInfo } from "../context";

export async function fetchPersonalInfo() {
  const employeeInfo = await getEmployeeInfo();
  
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', employeeInfo.id)
    .single();

  if (error) throw error;
  return data;
}

export async function updatePersonalInfo(updates: any) {
  const employeeInfo = await getEmployeeInfo();
  
  const { data, error } = await supabase
    .from('employees')
    .update(updates)
    .eq('id', employeeInfo.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
