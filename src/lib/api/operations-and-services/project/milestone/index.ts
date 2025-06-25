import { supabase } from "@/lib/supabase/client";
import { getCompanyId } from "@/lib/api/company/companyInfo";
import { Milestone } from "@/lib/types";
import { validateMilestone } from "@/lib/utils/validation";

export async function getMilestones() {
  const company_id = await getCompanyId();

  const { data, error } = await supabase
    .from("milestone_records")
    .select("*")
    .eq("company_id", company_id);

  if (error) throw error;
  return data;
}

export async function createMilestone(payload: Milestone) {
  const company_id = await getCompanyId();

  const validation = validateMilestone(payload);
  if (!validation.success) {
    const error = new Error("Validation failed");
    (error as any).issues = validation.errors;
    throw error;
  }

  const { data, error } = await supabase.from("milestone_records").insert({
    ...payload,
    company_id,
  });

  if (error) throw error;
  return data;
}

export async function updateMilestone(payload: Milestone) {
  const company_id = await getCompanyId();

  const validation = validateMilestone(payload);
  if (!validation.success) {
    const error = new Error("Validation failed");
    (error as any).issues = validation.errors;
    throw error;
  }

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
