import { createClient } from "@/lib/supabase/client";

export async function getGrades(userId: string): Promise<any[]> {
  const supabase = await createClient();
  // Get company_id for the user
  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("company_id")
    .eq("id", userId)
    .single();
  if (employeeError) throw employeeError;
  const company_id = employee.company_id;
  // Fetch grades
  const { data: grades, error } = await supabase
    .from("grades")
    .select("*")
    .eq("company_id", company_id);
  if (error) throw error;
  return grades;
}

export async function createGrade(userId: string, grade: Omit<any, "id">): Promise<any> {
  const supabase = await createClient();
  // Get company_id for the user
  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("company_id")
    .eq("id", userId)
    .single();
  if (employeeError) throw employeeError;
  const company_id = employee.company_id;
  // Insert grade
  const { data, error } = await supabase
    .from("grades")
    .insert({ ...grade, company_id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteGrade(id: number): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("grades")
    .delete()
    .eq("id", id);
  if (error) throw error;
} 