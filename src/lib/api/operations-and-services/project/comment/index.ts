import { z } from "zod";
import { supabase } from "@/lib/supabase/client";
import { getCompanyId } from "@/lib/auth/getUser";
import { commentSchema } from "@/lib/types";

export async function getComments() {
  const company_id = await getCompanyId();

  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("company_id", company_id);

  if (error) throw error;
  return data;
}

export async function createComment(payload: z.infer<typeof commentSchema>) {
  const company_id = await getCompanyId();

  const validated = commentSchema.safeParse(payload);
  if (!validated.success) throw validated.error;

  const { data, error } = await supabase.from("comments").insert({
    ...payload,
    company_id,
  });

  if (error) throw error;
  return data;
}

export async function updateComment(payload: z.infer<typeof commentSchema>) {
  const company_id = await getCompanyId();

  const validated = commentSchema.safeParse(payload);
  if (!validated.success) throw validated.error;

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
