import { createClient } from "@/lib/supabase/client";
import { Education } from "@/hooks/useEducation";
import { Experience } from "@/hooks/useExperience";

/**
 * Fetch education records for a specific user by ID
 * @param uid User ID
 * @returns Promise with array of education records
 */
export async function fetchUserEducation(uid: string): Promise<Education[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("schoolings")
    .select("*")
    .eq("employee_id", uid);
    
  if (error) {
    throw new Error(error.message);
  }
  
  return data || [];
}

/**
 * Fetch experience records for a specific user by ID
 * @param uid User ID
 * @returns Promise with array of experience records
 */
export async function fetchUserExperience(uid: string): Promise<Experience[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("experiences")
    .select("*")
    .eq("employee_id", uid);
    
  if (error) {
    throw new Error(error.message);
  }
  
  return data || [];
}

/**
 * Fetch both education and experience records for a specific user by ID
 * @param uid User ID
 * @returns Promise with object containing education and experience arrays
 */
export async function fetchUserEducationAndExperience(uid: string): Promise<{
  education: Education[];
  experience: Experience[];
}> {
  try {
    const [education, experience] = await Promise.all([
      fetchUserEducation(uid),
      fetchUserExperience(uid)
    ]);
    
    return { education, experience };
  } catch (error) {
    console.error("Error fetching education and experience:", error);
    throw error;
  }
} 