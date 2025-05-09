"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCompanyId } from "@/lib/auth/getUser";
import { newsAndNoticeTypeSchema } from "@/lib/types";

export async function getNewsAndNoticeTypes() {
  const client = await createClient();
  const company_id = await getCompanyId();

  const { data, error } = await client
    .from("notice_types")
    .select("*")
    .eq("company_id", company_id);

  if (error) throw error;
  return data;
}

export async function createNewsAndNoticeType(
  payload: z.infer<typeof newsAndNoticeTypeSchema>
) {
  const client = await createClient();
  const company_id = await getCompanyId();

  const validated = newsAndNoticeTypeSchema.safeParse(payload);
  if (!validated.success) throw validated.error;

  const { id, ...rest } = payload;

  const { data, error } = await client.from("notice_types").insert({
    ...rest,
    company_id,
  });

  if (error) throw error;
  return data;
}

export async function deleteNewsAndNoticeType(id: number) {
  const client = await createClient();
  const company_id = await getCompanyId();

  const { error } = await client
    .from("notice_types")
    .delete()
    .eq("id", id)
    .eq("company_id", company_id);

  if (error) throw error;
}
