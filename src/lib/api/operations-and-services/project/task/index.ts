import { z } from "zod";
import { supabase } from "@/lib/supabase/client";
import { getEmployeeInfo } from "@/lib/api/employee";
import { getCompanyId } from "@/lib/api/company/companyInfo";
import { taskSchema } from "@/lib/types";

export async function getTasks() {
  const company_id = await getCompanyId();
  const user = await getEmployeeInfo();

  const { data, error } = await supabase
    .from("task_records")
    .select("*")
    .eq("company_id", company_id)
    .eq("status", false)
    .or(
      `assignees.cs.{${user.id}}, created_by.eq.${user.id}, department_id.eq.${user.department_id}`
    );

  if (error) throw error;
  return data;
}

export async function createTask(payload: z.infer<typeof taskSchema>) {
  const company_id = await getCompanyId();

  const validated = taskSchema.safeParse(payload);
  if (!validated.success) throw validated.error;

  const { data, error } = await supabase.from("task_records").insert({
    ...payload,
    company_id,
  });

  if (error) throw error;
  return data;
}

export async function updateTask(payload: z.infer<typeof taskSchema>) {
  const company_id = await getCompanyId();

  const validated = taskSchema.safeParse(payload);
  if (!validated.success) throw validated.error;

  const { data, error } = await supabase
    .from("task_records")
    .update(payload)
    .eq("id", payload.id)
    .eq("company_id", company_id);

  if (error) throw error;
  return data;
}

export async function deleteTask(id: number) {
    const company_id = await getCompanyId();

  const { error } = await supabase
    .from("task_records")
    .delete()
    .eq("id", id)
    .eq("company_id", company_id);

  if (error) throw error;
}
