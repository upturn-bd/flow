"use server";

import { createClient } from "../supabase/server";
import { User } from "@supabase/supabase-js";

export async function getUserFromServer(): Promise<{ user: User | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (data.user) {
    return { user: data.user };
  }
  if (error) console.error(error);
  return { user: null };
}

export async function getEmployeeIdFromServer() {
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