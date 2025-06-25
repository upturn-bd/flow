import { supabase } from "@/lib/supabase/client";
import { getCompanyId } from "@/lib/api/company/companyInfo";
import { Comment } from "@/lib/types";
import { validateComment } from "@/lib/utils/validation";

export async function getComments() {
  const company_id = await getCompanyId();

  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("company_id", company_id);

  if (error) throw error;
  return data;
}

export async function createComment(payload: Comment) {
  const company_id = await getCompanyId();

  const validation = validateComment(payload);
  if (!validation.success) {
    const error = new Error("Validation failed");
    (error as any).issues = validation.errors;
    throw error;
  }

  const { data, error } = await supabase.from("comments").insert({
    ...payload,
    company_id,
  });

  if (error) throw error;
  return data;
}

export async function updateComment(payload: Comment) {
  const company_id = await getCompanyId();

  const validation = validateComment(payload);
  if (!validation.success) {
    const error = new Error("Validation failed");
    (error as any).issues = validation.errors;
    throw error;
  }

  const { data, error } = await supabase
    .from("comments")
    .update(payload)
    .eq("id", payload.id)
    .eq("company_id", company_id);

  if (error) throw error;
  return data;
}

export async function deleteComment(id: number) {
  const company_id = await getCompanyId();

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", id)
    .eq("company_id", company_id);

  if (error) throw error;
}
