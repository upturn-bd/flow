import { createClient } from "@/lib/supabase/client";

export async function getPersonalInfo(userId: string): Promise<any | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("personal_infos")
    .select(
      `
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
      `
    )
    .eq("id", userId)
    .single();
  if (error?.code === "PGRST116") {
    return null;
  }
  if (error) throw error;
  return data;
}

export async function upsertPersonalInfo(userId: string, info: any): Promise<any> {
  const supabase = await createClient();
  // Get company_id for the user
  const { data: employeeData, error: employeeError } = await supabase
    .from("employees")
    .select("company_id")
    .eq("id", userId)
    .single();
  if (employeeError || !employeeData) throw employeeError || new Error("Failed to fetch employee data");
  const { data, error } = await supabase
    .from("personal_infos")
    .upsert({
      id: userId,
      company_id: employeeData.company_id,
      ...info,
    })
    .select();
  if (error) throw error;
  return data[0];
} 