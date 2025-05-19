"use client";

import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { getCompanyId } from "@/lib/api/company-info/employees"
import { taskSchema } from "@/lib/types";
import { useContext } from "react";
import { AuthContext } from "@/lib/auth/auth-provider";

export async function getTasks() {
  const client = createClient();
  const company_id = await getCompanyId();
  const { employee } = useContext(AuthContext)!;

  const { data, error } = await client
    .from("task_records")
    .select("*")
    .eq("company_id", company_id)
    .eq("status", false)
    .or(
      `assignees.cs.{${employee!.id}},created_by.eq.${employee!.id}, department_id.eq.${employee!.department_id}`
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
