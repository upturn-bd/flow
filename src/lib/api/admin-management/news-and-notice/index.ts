import { z } from "zod";
import { supabase } from "@/lib/supabase/client";
import { getCompanyId } from "@/lib/api/company/companyInfo";
import { newsAndNoticeTypeSchema } from "@/lib/types";

export async function getNewsAndNoticeTypes() {
  const company_id = await getCompanyId();

  const { data, error } = await supabase
    .from("notice_types")
    .select("*")
    .eq("company_id", company_id);

  if (error) throw error;
  return data;
}

export async function createNewsAndNoticeType(
  payload: z.infer<typeof newsAndNoticeTypeSchema>
) {
  const company_id = await getCompanyId();

  const validated = newsAndNoticeTypeSchema.safeParse(payload);
  if (!validated.success) throw validated.error;

  const { data, error } = await supabase.from("notice_types").insert({
    ...payload,
    company_id,
  });

  if (error) throw error;
  return data;
}

export async function deleteNewsAndNoticeType(id: number) {
  const company_id = await getCompanyId();

  const { error } = await supabase
    .from("notice_types")
    .delete()
    .eq("id", id)
    .eq("company_id", company_id);

  if (error) throw error;
}
