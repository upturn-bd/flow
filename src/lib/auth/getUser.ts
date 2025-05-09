"use server"

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
