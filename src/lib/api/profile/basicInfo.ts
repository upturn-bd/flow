/**
 * Basic Info API functions
 * Handles employee basic information management
 */

import { supabase } from "@/lib/supabase/client";
import { getEmployeeInfo, getUserId } from "../context";

export async function fetchCurrentUserBasicInfo() {
  const employeeInfo = await getEmployeeInfo();
  
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', employeeInfo.id)
    .single();

  if (error) throw error;
  return data;
}

export async function fetchUserBasicInfo(userId: string) {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateBasicInfo(updates: any) {
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

export async function isCurrentUserProfile(userId: string) {
  const currentUserId = await getUserId();
  return currentUserId === userId;
}
