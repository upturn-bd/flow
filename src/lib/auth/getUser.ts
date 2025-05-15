"use server";

import { createClient } from "../supabase/server";
import { User } from "@supabase/supabase-js";

export async function getUser(): Promise<{ user: User | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (data.user) {
    return { user: data.user };
  }
  if (error) console.error(error);
  return { user: null };
}

export async function getEmployeeId() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Not authenticated" };
  }

  return user.id;
}

export async function getCompanyId() {
  const supabase = await createClient();

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

export async function getDepartmentsByCompanyId(companyId: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("departments")
    .select("id, name")
    .eq("company_id", companyId);

  if (error) throw error;
  return data;
}

export async function getEmployeesByCompanyId(companyId: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select("id, first_name, last_name, role")
    .eq("company_id", companyId);

  const formattedData = data?.map((employee) => {
    return {
      id: employee.id,
      name: `${employee.first_name} ${employee.last_name}`,
      role: employee.role,
    };
  });

  if (error) throw error;
  return formattedData;
}

export async function getUserInfo() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("employees")
    .select("id, first_name, last_name, role, company_id, supervisor_id, department_id")
    .eq("id", user?.id)
    .single();

  if (error) throw error;
  return {
    id: data.id,
    name: `${data.first_name} ${data.last_name}`,
    role: data.role,
    company_id: data.company_id,
    supervisor_id: data.supervisor_id,
    department_id: data.department_id,
  };
}
