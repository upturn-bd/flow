import { createClient } from "@/lib/supabase/client";

export async function getDepartments(userId: string): Promise<any[]> {
  const supabase = await createClient();
  // Get company_id for the user
  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("company_id")
    .eq("id", userId)
    .single();
  if (employeeError) throw employeeError;
  const company_id = employee.company_id;
  // Fetch departments
  const { data: departments, error } = await supabase
    .from("departments")
    .select("*")
    .eq("company_id", company_id);
  if (error) throw error;
  return departments;
}

export async function createDepartment(userId: string, department: Omit<any, "id">): Promise<any> {
  const supabase = await createClient();
  // Get company_id for the user
  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("company_id")
    .eq("id", userId)
    .single();
  if (employeeError) throw employeeError;
  const company_id = employee.company_id;
  // Insert department
  const { data, error } = await supabase
    .from("departments")
    .insert({ ...department, company_id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateDepartment(id: number, updateData: any): Promise<any> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("departments")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDepartment(id: number): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("departments")
    .delete()
    .eq("id", id);
  if (error) throw error;
} 