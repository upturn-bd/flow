"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { getCompanyId, getUserInfo } from "@/lib/auth/getUser";
import { taskSchema } from "@/lib/types";

export async function getTasks() {
  const client = createClient();
  const company_id = await getCompanyId();
  const user = await getUserInfo();

  const { data, error } = await client
    .from("task_records")
    .select("*")
    .eq("company_id", company_id)
    .eq("status", false)
    .or(
      `assignees.cs.{${user.id}},created_by.eq.${user.id}, department_id.eq.${user.department_id}`
    );

  if (error) throw error;
  return data;
}

export async function createTask(payload: z.infer<typeof taskSchema>) {
  const client = createClient();
  const company_id = await getCompanyId();

  const validated = taskSchema.safeParse(payload);
  if (!validated.success) throw validated.error;

  const { data, error } = await client.from("task_records").insert({
    ...payload,
    company_id,
  });

  if (error) throw error;
  return data;
}

export async function updateTask(payload: z.infer<typeof taskSchema>) {
  const client = createClient();
  const company_id = await getCompanyId();

  const validated = taskSchema.safeParse(payload);
  if (!validated.success) throw validated.error;

  const { data, error } = await client
    .from("task_records")
    .update(payload)
    .eq("id", payload.id)
    .eq("company_id", company_id);

  if (error) throw error;
  return data;
}

export async function deleteTask(id: number) {
  const client = createClient();
  const company_id = await getCompanyId();

  const { error } = await client
    .from("task_records")
    .delete()
    .eq("id", id)
    .eq("company_id", company_id);

  if (error) throw error;
}
