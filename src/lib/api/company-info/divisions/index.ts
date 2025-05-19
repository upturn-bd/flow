import { createClient } from "@/lib/supabase/client";

export async function getDivisions(userId: string): Promise<any[]> {
  const supabase = await createClient();
  // Get company_id for the user
  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("company_id")
    .eq("id", userId)
    .single();
  if (employeeError) throw employeeError;
  const company_id = employee.company_id;
  // Fetch divisions
  const { data: divisions, error } = await supabase
    .from("divisions")
    .select("*")
    .eq("company_id", company_id);
  if (error) throw error;
  return divisions;
}

export async function createDivision(userId: string, division: Omit<any, "id">): Promise<any> {
  const supabase = await createClient();
  // Get company_id for the user
  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("company_id")
    .eq("id", userId)
    .single();
  if (employeeError) throw employeeError;
  const company_id = employee.company_id;
  // Insert division
  const { data, error } = await supabase
    .from("divisions")
    .insert({ ...division, company_id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateDivision(id: number, updateData: any): Promise<any> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("divisions")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDivision(id: number): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("divisions")
    .delete()
    .eq("id", id);
  if (error) throw error;
} 