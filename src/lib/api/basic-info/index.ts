import { supabase } from "@/lib/supabase/client";

export async function getBasicInfo(userId: string): Promise<any | null> {
  const { data, error } = await supabase
    .from("employees")
    .select(
      "first_name, last_name, email, phone_number, department_id, designation, job_status, hire_date, id_input"
    )
    .eq("id", userId)
    .single();
  if (error?.code === "PGRST116") {
    return null;
  }
  if (error) throw error;
  return data;
}

export async function updateBasicInfo(userId: string, info: any): Promise<void> {
  const { error } = await supabase
    .from("employees")
    .update({ ...info })
    .eq("id", userId);
  if (error) throw error;
} 