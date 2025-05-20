import { createClient } from "@/lib/supabase/client";
import { PersonalFormData } from "@/app/(home)/hris/tabs/personalInfo.constants";

/**
 * Fetch personal information for the current user
 * @returns Promise with personal info data or null if not found
 */
export async function fetchCurrentUserPersonalInfo(): Promise<PersonalFormData | null> {
  const res = await fetch("/api/personal-info");
  if (res.status === 204) {
    return null;
  }
  if (!res.ok) {
    throw new Error("Failed to fetch personal info");
  }
  const { data } = await res.json();
  return data || null;
}

/**
 * Fetch personal information for a specific user by ID
 * @param uid User ID
 * @returns Promise with personal info data or null if not found
 */
export async function fetchUserPersonalInfo(uid: string): Promise<PersonalFormData | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("personal_infos")
    .select("*")
    .eq("id", uid)
    .single();
    
  if (error) {
    if (error.code === "PGRST116") { // Record not found
      return null;
    }
    throw new Error(error.message);
  }
  
  return data;
}

/**
 * Update personal information for the current user
 * @param personalInfo Updated personal info data
 * @returns Promise that resolves when update is successful
 */
export async function updatePersonalInfo(personalInfo: PersonalFormData): Promise<void> {
  const response = await fetch("/api/personal-info", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...personalInfo,
      date_of_birth: personalInfo.date_of_birth ? new Date(personalInfo.date_of_birth).toISOString() : undefined,
      blood_group: personalInfo.blood_group || undefined,
      marital_status: personalInfo.marital_status || undefined,
      gender: personalInfo.gender || undefined,
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.message || `Error: ${response.status}`);
  }
} 