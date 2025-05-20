import { supabase } from "@/lib/supabase/client";
import { BasicInfoFormData } from "@/app/(home)/hris/tabs/basicInfo.constants";

/**
 * Fetch basic information for the current user
 * @returns Promise with basic info data
 */
export async function fetchCurrentUserBasicInfo(): Promise<BasicInfoFormData> {
  // Using direct Supabase client access instead of API route
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error("Not authenticated");
    }
    
    const { data, error } = await supabase
      .from("employees")
      .select("first_name, last_name, email, phone_number, department_id, designation, job_status, hire_date, id_input")
      .eq("id", user.id)
      .single();
      
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  } catch (error) {
    console.error("Error fetching basic info:", error);
    throw error;
  }
}

/**
 * Fetch basic information for a specific user by ID
 * @param uid User ID
 * @returns Promise with basic info data
 */
export async function fetchUserBasicInfo(uid: string): Promise<BasicInfoFormData> {
  const { data, error } = await supabase
    .from("employees")
    .select("first_name, last_name, email, phone_number, department_id, designation, job_status, hire_date, id_input")
    .eq("id", uid)
    .single();
    
  if (error) {
    throw new Error(error.message);
  }
  
  return data;
}

/**
 * Update basic information for the current user
 * @param basicInfo Updated basic info data
 * @returns Promise with updated data
 */
export async function updateBasicInfo(basicInfo: BasicInfoFormData): Promise<{ data: BasicInfoFormData }> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error("Not authenticated");
    }
    
    const { data, error } = await supabase
      .from("employees")
      .update({
        ...basicInfo,
        department_id: Number(basicInfo.department_id),
      })
      .eq("id", user.id)
      .select()
      .single();
      
    if (error) {
      throw new Error(error.message);
    }
    
    return { data };
  } catch (error) {
    console.error("Error updating basic info:", error);
    throw error;
  }
}

/**
 * Check if the current user is viewing their own profile
 * @param uid User ID to check
 * @returns Promise with boolean indicating if the user is viewing their own profile
 */
export async function isCurrentUserProfile(uid?: string | null): Promise<boolean> {
  if (!uid) return true;
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id === uid;
  } catch (error) {
    console.error("Error checking current user:", error);
    return false;
  }
} 