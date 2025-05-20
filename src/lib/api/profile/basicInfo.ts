import { createClient } from "@/lib/supabase/client";
import { BasicInfoFormData } from "@/app/(home)/hris/tabs/basicInfo.constants";

/**
 * Fetch basic information for the current user
 * @returns Promise with basic info data
 */
export async function fetchCurrentUserBasicInfo(): Promise<BasicInfoFormData> {
  const res = await fetch("/api/basic-info");
  if (!res.ok) {
    throw new Error("Failed to fetch basic info");
  }
  const { data } = await res.json();
  return data;
}

/**
 * Fetch basic information for a specific user by ID
 * @param uid User ID
 * @returns Promise with basic info data
 */
export async function fetchUserBasicInfo(uid: string): Promise<BasicInfoFormData> {
  const supabase = createClient();
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
  const response = await fetch("/api/basic-info", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...basicInfo,
      department_id: Number(basicInfo.department_id),
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.message || `Error: ${response.status}`);
  }

  return await response.json();
}

/**
 * Check if the current user is viewing their own profile
 * @param uid User ID to check
 * @returns Promise with boolean indicating if the user is viewing their own profile
 */
export async function isCurrentUserProfile(uid?: string | null): Promise<boolean> {
  if (!uid) return true;
  
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id === uid;
  } catch (error) {
    console.error("Error checking current user:", error);
    return false;
  }
} 