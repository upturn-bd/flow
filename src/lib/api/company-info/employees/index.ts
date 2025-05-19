import { supabase } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

/**
 * Get the current authenticated user.
 */
export async function getUser(): Promise<{ user: User | null }> {
  const { data, error } = await supabase.auth.getUser();
  if (data.user) {
    return { user: data.user };
  }
  if (error) console.error(error);
  return { user: null };
}

/**
 * Get the current employee's ID.
 */
export async function getEmployeeId(): Promise<string | { error: string }> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Not authenticated" };
  }
  return user.id;
}

/**
 * Get the current employee's company ID.
 */
export async function getCompanyId(): Promise<number | { error: string }> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Not authenticated" };
  }
  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("company_id")
    .eq("id", user.id)
    .single();
  if (employeeError) {
    return { error: "Error fetching employee data" };
  }
  return employee.company_id;
}

/**
 * Get all departments for a given company ID.
 */
export async function getDepartmentsByCompanyId(companyId: number): Promise<{ id: number; name: string }[]> {
  const { data, error } = await supabase
    .from("departments")
    .select("id, name")
    .eq("company_id", companyId);
  if (error) throw error;
  return data || [];
}

/**
 * Get all employees for a given company ID.
 */
export async function getEmployeesByCompanyId(companyId: number): Promise<{ id: string; name: string; role: string }[]> {
  const { data, error } = await supabase
    .from("employees")
    .select("id, first_name, last_name, role")
    .eq("company_id", companyId);
  if (error) throw error;
  return (
    data?.map((employee) => ({
      id: employee.id,
      name: `${employee.first_name} ${employee.last_name}`,
      role: employee.role,
    })) || []
  );
}

/**
 * Get all employees for a given userId or companyId.
 * If userId is provided, looks up company_id. If companyId is provided, uses it directly.
 */
export async function getEmployees({ userId, companyId }: { userId?: string; companyId?: number }): Promise<{ id: string; name: string; role: string }[]> {
  let resolvedCompanyId = companyId;
  if (!resolvedCompanyId && userId) {
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("company_id")
      .eq("id", userId)
      .single();
    if (employeeError) throw employeeError;
    resolvedCompanyId = employee.company_id;
  }
  if (!resolvedCompanyId) throw new Error("companyId or userId required");
  const { data: employees, error } = await supabase
    .from("employees")
    .select("id, first_name, last_name, role")
    .eq("company_id", resolvedCompanyId);
  if (error) throw error;
  return (
    employees?.map((employee) => ({
      id: employee.id,
      name: `${employee.first_name} ${employee.last_name}`,
      role: employee.role,
    })) || []
  );
}