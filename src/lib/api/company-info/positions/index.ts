import { createClient } from "@/lib/supabase/client";

export async function getPositions(userId: string): Promise<any[]> {
  const supabase = await createClient();
  // Get company_id for the user
  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("company_id")
    .eq("id", userId)
    .single();
  if (employeeError) throw employeeError;
  const company_id = employee.company_id;
  // Fetch positions
  const { data: positions, error } = await supabase
    .from("positions")
    .select("*")
    .eq("company_id", company_id);
  if (error) throw error;
  return positions;
}

export async function createPosition(userId: string, position: Omit<any, "id">): Promise<any> {
  const supabase = await createClient();
  // Get company_id for the user
  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("company_id")
    .eq("id", userId)
    .single();
  if (employeeError) throw employeeError;
  const company_id = employee.company_id;
  // Insert position
  const { data, error } = await supabase
    .from("positions")
    .insert({ ...position, company_id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePosition(id: number, updateData: any): Promise<any> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("positions")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePosition(id: number): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("positions")
    .delete()
    .eq("id", id);
  if (error) throw error;
} 