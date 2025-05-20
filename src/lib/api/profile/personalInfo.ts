import { supabase } from "@/lib/supabase/client";
import { PersonalFormData } from "@/app/(home)/hris/tabs/personalInfo.constants";

/**
 * Fetch personal information for the current user
 * @returns Promise with personal info data or null if not found
 */
export async function fetchCurrentUserPersonalInfo(): Promise<PersonalFormData | null> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error("Not authenticated");
    }
    
    const { data, error } = await supabase
      .from("personal_infos")
      .select(`
        date_of_birth,
        gender,
        blood_group,
        marital_status,
        nid_no,
        religion,
        father_name,
        mother_name,
        spouse_name,
        emergency_contact_name,
        emergency_contact_phone,
        emergency_contact_relation,
        permanent_address
      `)
      .eq("id", user.id)
      .single();
      
    if (error) {
      if (error.code === "PGRST116") { // Record not found
        return null;
      }
      throw new Error(error.message);
    }
    
    return data;
  } catch (error) {
    console.error("Error fetching personal info:", error);
    throw error;
  }
}

/**
 * Fetch personal information for a specific user by ID
 * @param uid User ID
 * @returns Promise with personal info data or null if not found
 */
export async function fetchUserPersonalInfo(uid: string): Promise<PersonalFormData | null> {
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
 * Updates or creates personal information for the current user
 * @param personalInfoData Personal information to update
 * @returns Promise with updated personal info data
 */
export async function updatePersonalInfo(personalInfoData: PersonalFormData): Promise<PersonalFormData> {
  try {
    // First get the user to ensure authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error("Not authenticated");
    }
    
    // Get company_id from the employees table
    const { data: employeeData, error: employeeError } = await supabase
      .from("employees")
      .select("company_id")
      .eq("id", user.id)
      .single();
      
    if (employeeError) {
      throw new Error("Failed to fetch employee data");
    }
    
    // Prepare data for upsert
    const formattedData = {
      id: user.id,
      company_id: employeeData.company_id,
      ...personalInfoData,
      date_of_birth: personalInfoData.date_of_birth ? new Date(personalInfoData.date_of_birth).toISOString() : undefined,
      blood_group: personalInfoData.blood_group || undefined,
      marital_status: personalInfoData.marital_status || undefined,
      gender: personalInfoData.gender || undefined,
    };
    
    // Upsert the personal info
    const { data, error } = await supabase
      .from("personal_infos")
      .upsert(formattedData)
      .select();
      
    if (error) {
      throw error;
    }
    
    return data[0];
  } catch (error) {
    console.error("Error updating personal info:", error);
    throw error;
  }
}

/**
 * Fetches personal information for a user
 * If no userId is provided, fetches for the current user
 * This provides the same functionality as fetchCurrentUserPersonalInfo and fetchUserPersonalInfo combined
 */
export async function getPersonalInfo(userId?: string): Promise<PersonalFormData | null> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error("Not authenticated");
    }
    
    // Determine which user to fetch data for
    const targetUserId = userId || user.id;
    
    // If trying to access someone else's data, log for auditing purposes
    if (userId && user.id !== userId) {
      console.log(`User ${user.id} is accessing personal info for ${userId}`);
    }
    
    // Fetch personal info
    const { data, error } = await supabase
      .from("personal_infos")
      .select(`
        date_of_birth,
        gender,
        blood_group,
        marital_status,
        nid_no,
        religion,
        father_name,
        mother_name,
        spouse_name,
        emergency_contact_name,
        emergency_contact_phone,
        emergency_contact_relation,
        permanent_address
      `)
      .eq("id", targetUserId)
      .single();
      
    if (error) {
      // If no record exists yet, return null
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error fetching personal info:", error);
    throw error;
  }
} 