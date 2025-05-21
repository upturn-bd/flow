import { supabase } from "@/lib/supabase/client";
import { getEmployeeInfo } from "@/lib/api/employee";
import { z } from "zod";

/**
 * Get the supervisor for the current user
 */
export async function getSupervisor() {
  try {
    const user = await getEmployeeInfo();
    
    if (!user || !user.supervisor_id) {
      return null;
    }
    
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("id", user.supervisor_id)
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching supervisor:", error);
    return null;
  }
}

/**
 * Fetch leave history for the current user
 */
export async function fetchLeaveHistory() {
  try {
    const user = await getEmployeeInfo();
    
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    const { data, error } = await supabase
      .from("leave_records")
      .select("*")
      .eq("employee_id", user.id)
      .order("created_at", { ascending: false });
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching leave history:", error);
    throw error;
  }
} 