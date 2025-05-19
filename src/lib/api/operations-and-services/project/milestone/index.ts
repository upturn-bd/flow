"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { getCompanyId } from "@/lib/api/company-info/employees"
import { milestoneSchema } from "@/lib/types";

export async function getMilestones() {
  const client = createClient();
  const company_id = await getCompanyId();

  const { data, error } = await client
    .from("milestone_records")
    .select("*")
    .eq("company_id", company_id);

  if (error) throw error;
  return data;
}

export async function createMilestone(payload: z.infer<typeof milestoneSchema>) {
  const client = createClient();
  const company_id = await getCompanyId();

  const validated = milestoneSchema.safeParse(payload);
  if (!validated.success) throw validated.error;


  const { data, error } = await client.from("milestone_records").insert({
    ...payload,
    company_id,
  });

  if (error) throw error;
  return data;
}

export async function updateMilestone(payload: z.infer<typeof milestoneSchema>) {
  const client = createClient();
  const company_id = await getCompanyId();

  const validated = milestoneSchema.safeParse(payload);
  if (!validated.success) throw validated.error;

  const { data, error } = await client
    .from("milestone_records")
    .update(payload)
    .eq("id", payload.id)
    .eq("company_id", company_id);

  if (error) throw error;
  return data;
}

export async function deleteMilestone(id: number) {
  const client = createClient();
  const company_id = await getCompanyId();

  const { error } = await client
    .from("milestone_records")
    .delete()
    .eq("id", id)
    .eq("company_id", company_id);

  if (error) throw error;
}
