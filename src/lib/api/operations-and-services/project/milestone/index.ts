import { z } from "zod";
import { supabase } from "@/lib/supabase/client";
import { getCompanyId } from "@/lib/auth/getUser";
import { milestoneSchema } from "@/lib/types";

export async function getMilestones() {
  const company_id = await getCompanyId();

  const { data, error } = await supabase
    .from("milestone_records")
    .select("*")
    .eq("company_id", company_id);

  if (error) throw error;
  return data;
}

export async function createMilestone(payload: z.infer<typeof milestoneSchema>) {
  const company_id = await getCompanyId();

  const validated = milestoneSchema.safeParse(payload);
  if (!validated.success) throw validated.error;


  const { data, error } = await supabase.from("milestone_records").insert({
    ...payload,
    company_id,
  });

  if (error) throw error;
  return data;
}

export async function updateMilestone(payload: z.infer<typeof milestoneSchema>) {
  const company_id = await getCompanyId();

  const validated = milestoneSchema.safeParse(payload);
  if (!validated.success) throw validated.error;

  const { data, error } = await supabase
    .from("milestone_records")
    .update(payload)
    .eq("id", payload.id)
    .eq("company_id", company_id);

  if (error) throw error;
  return data;
}

export async function deleteMilestone(id: number) {
  const company_id = await getCompanyId();

  const { error } = await supabase
    .from("milestone_records")
    .delete()
    .eq("id", id)
    .eq("company_id", company_id);

  if (error) throw error;
}
